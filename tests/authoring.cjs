// GPL-3.0. Use a clean SNES Advance Regular ROM; optional second path writes an emulator fixture.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.join(__dirname,".."),html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const realPNG=process.argv.includes("--png");
function pngRoundtrip(rgba,width,height){
    if(!realPNG)return rgba;
    const code=[
        "import sys,io","from PIL import Image",
        "w,h=map(int,sys.argv[1:])","im=Image.frombytes('RGBA',(w,h),sys.stdin.buffer.read())",
        "png=io.BytesIO()","im.save(png,format='PNG')","png.seek(0)",
        "im=Image.open(png)","assert im.format=='PNG' and im.size==(w,h)","sys.stdout.buffer.write(im.convert('RGBA').tobytes())"
    ].join("\n");
    return require("node:child_process").execFileSync(process.env.PYTHON||"python",["-c",code,width,height].map(String),{
        input:Buffer.from(rgba),maxBuffer:rgba.length+1024});
}
const ctx=vm.createContext({console,assert,atob,pngRoundtrip,crypto:require("node:crypto").webcrypto,
    input:fs.readFileSync(process.argv[2]),fixture:(bytes,meta)=>{
        if(process.argv[3] && !process.argv[3].startsWith("--")){fs.writeFileSync(process.argv[3],bytes);fs.writeFileSync(process.argv[3]+".json",JSON.stringify(meta,null,2));}
    }});
for(const [,file] of html.matchAll(/<script defer src="([^"]+)"/g)){
    if(file==="ui.js")break;
    vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),ctx,{filename:file});
}
async function tests(){
    const s=await AdvanceRom.open(Uint8Array.from(input)),orig=s.original,p=mapProject(s);
    const equal=(a,b)=>assert.ok(sameBytes(a,b),"bytes differ");
    equal(s.export(),orig);
    for(let i=0;i<33;i++){const b=battleList(orig,i);equal(b,assembleBattle(printBattle(b)));}
    assert.throws(()=>assembleBattle("actor1 0\nend"));assert.throws(()=>assembleField("call missing\nreturn",0x3d5000));
    const branch=assembleField("if_set $5AF done\ngive_gp 2\ndone:\nreturn",0x3d5000);
    equal(branch,Uint8Array.of(192,175,133,9,80,51,132,2,0,254));
    const id=p.addRoom(415,"Den annex");assert.equal(id,431);
    const scene=p.scene("Arrival","set_bit $300\nset_bit $5AF\nreturn");
    p.change("Set entrance",q=>q.startup[id]=scene);
    const k="shortExits",exit=(map,dest)=>p.object(map,k,objectBytes(k,{x:9,y:9,destination:dest,destX:10,destY:9}));
    exit(415,id);exit(id,415);
    const flag=freeChestFlag(s);assert.ok(flag>=0);
    p.object(id,"mapTreasure",objectBytes("mapTreasure",{x:10,y:8,type:4,reward:233,switch:flag}));
    const talk=p.scene("Talk","set_bit $5AE\nreturn");
    p.object(id,"mapNPCs",objectBytes("mapNPCs",{x:11,y:9,sprite:0,event:EMPTY_SCENE}),talk);
    p.object(id,"mapEvents",objectBytes("mapEvents",{x:10,y:10}),talk);
    p.object(id,"longExits",objectBytes("longExits",{x:50,y:40,length:3,vertical:1,destination:415,destX:10,destY:9}));
    let owner=3;while(!stockObjectRows(s,owner,"mapEvents").length)owner++;
    p.change("Bind existing trigger",q=>q.bindings["mapEvents/"+owner+"/0"]=talk);
    const layer=unpackLayout(fromHex(p.state.rooms[0].layers[0])),newTile=layer[0]^1,template=mapLayerInfo(orig,415,0);
    layer[0]=newTile;p.setLayer(id,0,layer);
    for(let set=0;set<75;set++)assert.equal(metatileWords(s,set).length,2048);
    const metatile=3,ts=template.tileset,raw=metatileWords(s,ts);
    const words=[0,1,2,3].map(i=>readLE(raw,quadrantIndex(metatile,i),2));words[0]^=0x4000;
    editMetatile(s,ts,metatile,words);
    assert.equal(readLE(metatileWords(s,ts),quadrantIndex(metatile,0),2),words[0]);
    const col=orig[tables.maps.start+415*33+4],tile=0xf1,word=tileProperties(s,col)[tile]^1;
    setTileProperty(s,col,tile,word);assert.equal(tileProperties(s,col)[tile],word);
    const wordID=270;s.set("worldTerrain",wordID,"noFoot",!s.row("worldTerrain",wordID).noFoot.value);
    assert.throws(()=>s.set("battleAnimations",3,"sprite",32766));
    s.set("battleAnimations",3,"delay",17);
    const gres=graphicSheet(s,"monster",0);assert.ok(gres.positions.length);
    s.set("animationResources",650,"frameOffset",2949);
    s.set("battleAnimations",3,"sprite",650);
    assert.throws(()=>s.set("animationResources",650,"frameHeight",0));
    const frameIDs=[0,2948],frameResults=[];
    let readable=0,unreadable=[];
    for(let i=0;i<3025;i++){try{animationFrame(s,i);readable++;}catch(e){unreadable.push([i,e.message]);}}
    assert.equal(readable,3025);assert.equal(BATTLE_NAMES.length,33);
    console.log("Animation frame scan",readable,"readable;",unreadable.length,"exceptions",JSON.stringify(unreadable.slice(0,5)));
    for(let id of frameIDs){
        let f=animationFrame(s,id);while(!f.data.length)f=animationFrame(s,++id);
        const expected=f.data.slice();expected[1]^=64;
        const source=[];for(let j=0;j<expected.length;j+=2)source.push([expected[j]>>4,expected[j]&15,expected[j+1]&63,(expected[j+1]>>6)&1,expected[j+1]>>7].join(" "));
        saveFrame(s,id,source.join("\n"));equal(animationFrame(s,id).data,expected);
        assert.throws(()=>saveFrame(s,id,""));frameResults.push([f.at,expected]);
    }
    const drawings=[];
    for(const [kind,num] of [["monster",451],["sprite",0],["tiles",0],["layer3",1],["world",0],["world",1],["world",2]]){
        const sh=graphicSheet(s,kind,num),rgba=sheetRGBA(sh,true),[x,y]=sh.positions[0],pix=8*y*sh.w+8*x;
        const ink=sh.indices[pix]===1?2:1,color=Math.round(ink*255/(sh.colors.length-1));rgba.set([color,color,color,255],4*pix);
        importSheet(s,kind,num,0,0,Uint8ClampedArray.from(pngRoundtrip(rgba,sh.w,sh.h)),sh.w,sh.h,true);
        assert.equal(graphicSheet(s,kind,num).indices[pix],ink);
        const bad=rgba.slice();bad[4*pix+3]=128;assert.throws(()=>importSheet(s,kind,num,0,0,bad,sh.w,sh.h,true));
        drawings.push([kind,num,pix,ink]);
    }
    for(let i=0;i<3;i++)assert.equal(worldAtlas(s.baseOutput(),i).length,256*256*4);
    const changedScene="character_menu $80\ncharacter_menu $81\ncharacter_menu $82\ncharacter_menu $83\ncharacter_menu $84\ncharacter_menu $85\ncharacter_menu $86\ncharacter_menu $87\ncharacter_menu $88\ncharacter_menu $89\ncharacter_menu $8A\ncharacter_menu $8B\ncharacter_menu $8C\ncharacter_menu $8D\nend";
    p.change("Battle event",q=>q.battle[16]=changedScene);
    sessionAssets(s).set("scripts",260,assembleScript("event $10\nvariable $1F $19\nwait\nend\nend"));
    const out=s.export(),opened=await AdvanceRom.open(out);equal(out,opened.export());
    assert.equal(readLE(metatileWords(opened,ts),quadrantIndex(metatile,0),2),words[0]);
    for(const [at,bytes] of frameResults)equal(out.subarray(at,at+bytes.length),bytes);
    for(const [kind,num,pix,ink] of drawings)assert.equal(graphicSheet(opened,kind,num).indices[pix],ink);
    for(const key of Object.keys(OBJECT_DIRS)){
        const g=MAP_OBJECT_INDEX[key],[base]=OBJECT_DIRS[key],origin=key==="mapTreasure"?base+1024:base;
        let n=0;for(let m=0;m<431;m++){
            const lo=g.base+readLE(orig,g.pointer+m*2,2),hi=g.base+readLE(orig,g.pointer+m*2+2,2),at=origin+readLE(out,base+m*2,2);
            if(m===owner && key==="mapEvents")equal(orig.subarray(lo+5,hi),out.subarray(at+5,at+hi-lo));
            else equal(orig.subarray(lo,hi),out.subarray(at,at+hi-lo));
            n+=(hi-lo)/tables[key].width;
        }assert.equal(n,tables[key].count);
    }
    assert.equal(readLE(out,0x3dc000+32,2),0xc200+Array.from({length:16},(_,i)=>battleList(orig,i).length).reduce((a,b)=>a+b));
    assert.equal(out[0xce5ee],0xb2);
    const withHeader=new Uint8Array(out.length+512);withHeader.fill(123,0,512);withHeader.set(out,512);equal((await AdvanceRom.open(withHeader)).export(),withHeader);
    const broken=out.slice();broken[0x3dc200]^=1;await assert.rejects(()=>AdvanceRom.open(broken),/disagree/);
    const occupied=orig.slice();occupied[PROJECT_ARENA]=1;const conflict=await AdvanceRom.open(occupied);assert.throws(()=>mapProject(conflict).addRoom(415,"test"),/occupied/);equal(conflict.export(),occupied);
    assert.throws(()=>p.change("Too many NPCs",q=>{q.objects.push(...Array.from({length:32},()=>q.objects.find(o=>o.kind==="mapNPCs")));}),/32 NPCs/);
    fixture(out,{map:415,room:id,collisionSet:col,collisionTile:tile,collisionWord:word,flag,newTile,template:template.layout});
    while(s.model.undoStack.length)s.model.undo();equal(s.export(),orig);
    console.log("PASS. All five map directories preserved, two-way room exits, scene binding, field and world properties, seven graphics imports, animation records and frames, all 33 battle programs, occupied-space rejection, checksum, header and complete undo.");
}
vm.runInContext("("+tests.toString()+")()",ctx).catch(e=>{console.error(e);process.exitCode=1;});
