// node tests/map-workspace.cjs regular.sfc [output-fixture.sfc] [older-edited.sfc]
const fs=require("node:fs"), path=require("node:path"), vm=require("node:vm"), assert=require("node:assert/strict");
const root=path.join(__dirname,".."),html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const ctx=vm.createContext({console,assert,atob,crypto:require("node:crypto").webcrypto,rom:fs.readFileSync(process.argv[2]),
    write:bytes=>{if(process.argv[3])fs.writeFileSync(process.argv[3],bytes);},
    older:process.argv[4]?fs.readFileSync(process.argv[4]):null});
for(const [,file] of html.matchAll(/<script defer src="([^"]+)"/g)){
    if(file==="ui.js")break;vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),ctx,{filename:file});
}
async function run(){
    const s=await AdvanceRom.open(Uint8Array.from(rom)),r=s.original,p=mapProject(s);
    const objects=(map)=>mapObjects(s,map,s.baseOutput());
    let drawn=0,empty=0;
    for(let m=0;m<431;m++){
        const art=loadMapArt(s,m,r);
        if(!art.layers.length){empty++;continue;}
        const ids=art.layers.map(l=>l.bytes[mapLayerCell(l,0,0)]??-1);
        assert.equal(composeMapTile(art,ids).length,1024);drawn++;
    }
    assert.equal(drawn,424);assert.equal(empty,7);
    // Overlap checks with known independent channel values and relative priorities.
    const make=(l,rgb,high)=>{const atlas=new Uint8ClampedArray(65536*4),priority=new Uint8Array(65536);atlas.set([...rgb,255]);priority[0]=high;return {l,atlas,priority};};
    const sample={main:7,sub:0,math:0,back:[0,0,0],layers:[make(0,[255,0,0],0),make(1,[0,255,0],1),make(2,[0,0,255],0)]};
    const pixel=()=>Array.from(composeMapTile(sample,[0,0,0]).slice(0,4));
    assert.deepEqual(pixel(),[0,255,0,255]);sample.layers[2].priority[0]=1;assert.deepEqual(pixel(),[0,0,255,255]);
    sample.main=1;sample.sub=2;sample.math=65;assert.deepEqual(pixel(),[123,123,0,255]);
    assert.equal(mapLayerCell({width:8,height:4,dx:-1,dy:1,bytes:new Uint8Array(32)},0,0),15);
    const n=objects(20).find(o=>o.key==="mapNPCs/20/4"),ev=targetScene(s,20,n.key,n);
    assert.equal(ev.offset,0x2d1ff);assert.equal(mapDialogue(ev.source.split("\n")[0]).id,919);
    assert.equal(new FieldDialogue(s).searchText("dialogue",919),"So…magic really DOES exist!?");
    assert.equal(mapDialogue("dialog_48 $97 $C3").id,919);assert.equal(mapDialogue("dialogue $0F4C").key,"denDialogue");
    // These two idle poses were checked against the original Regular game running in Snes9x.
    const right="030c17a970f4d56b79eab68056414fc36798517766c6f9dda774abe2b0541655";
    const left="2ff893c5189be934f0462bd3904cde7b6f47f5af72330b7550ffb0ff3cb9675a";
    assert.equal(await hashBytes(mapNPCPixels(r,n)),right);
    const neighbor=objects(20).find(o=>o.key==="mapNPCs/20/5");
    assert.equal(await hashBytes(mapNPCPixels(r,neighbor)),left);
    assert.ok(nativeFieldBlock(r,0x2d207)[0].links.length===2);
    assert.ok(mapHit(objects(20),0,0).length>1);
    applyObjectFields(s,n,{x:43,y:26});assert.deepEqual(objectBounds(objects(20).find(o=>o.key===n.key)),{x:43,y:26,w:1,h:1});
    s.model.undo();assert.ok(sameBytes(s.export(),r));
    assert.throws(()=>applyObjectFields(s,n,{x:43,y:99}));assert.ok(sameBytes(s.export(),r));
    const id=p.addRoom(415,"Map workspace annex");
    const object=(map,key)=>objects(map).find(o=>o.key===key);
    function place(map,k,x,y,fields={}){
        const key=placeMapObject(s,map,k,x,y);applyObjectFields(s,object(map,key),fields);return object(map,key);
    }
    function bind(map,o,source){bindMapScene(s,map,o?.key??"entrance",o,null,source,"Test event");}
    bind(id,null,"set_bit $300\nset_bit $5AF\nreturn");
    const exit=place(415,"shortExits",9,9,{dest:id,destX:10,destY:9});
    place(id,"shortExits",9,9,{dest:415,destX:10,destY:9});
    const chest=place(id,"mapTreasure",10,8,{value:233});assert.equal(objectField(chest,"reward"),4);
    const npc=place(id,"mapNPCs",11,9);bind(id,npc,"set_bit $5AD\nreturn");
    const again=object(id,npc.key),size=p.state.scenes.length;bind(id,again,"set_bit $5AE\nreturn");assert.equal(p.state.scenes.length,size);
    const trigger=place(id,"mapEvents",10,10);bindMapScene(s,id,trigger.key,trigger,again.scene,null);
    bind(id,object(id,trigger.key),"set_bit $5AC\nreturn");assert.equal(p.state.scenes.length,size+1);s.model.undo();
    const span=place(id,"longExits",20,20,{span:2,vertical:1,dest:415});
    assert.ok(mapHit(objects(id),20,22).some(o=>o.key===span.key));assert.ok(!mapHit(objects(id),21,20).some(o=>o.key===span.key));
    const a=loadMapArt(s,id,projectMapROM(s,id));a.layers[0].bytes[0]^=1;p.setLayer(id,0,a.layers[0].bytes);
    const output=s.export(),copy=await AdvanceRom.open(output);assert.ok(sameBytes(copy.export(),output));
    assert.equal(objectField(mapObjects(copy,415,copy.baseOutput()).find(o=>o.key===exit.key),"dest"),id);
    assert.equal(mapProject(copy).state.objects.length,6);
    assert.equal(loadMapArt(copy,id,projectMapROM(copy,id)).layers[0].bytes[0],a.layers[0].bytes[0]);write(output);
    if(older){const old=await AdvanceRom.open(Uint8Array.from(older));assert.ok(sameBytes(old.export(),older));assert.ok(loadMapArt(old,431,projectMapROM(old,431)).layers.length);}
    console.log("PASS: 431 stock map records, priority/color math, region hit tests, Narshe dialogue, atomic moves, scene bindings, chests, exits, room painting and export/reopen.");
}
vm.runInContext("("+run.toString()+")()",ctx).catch(e=>{console.error(e);process.exitCode=1;});
