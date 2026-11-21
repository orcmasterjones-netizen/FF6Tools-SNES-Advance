// Offline regression checks. Pass a clean Regular ROM. An optional second argument
// receives a freshly edited emulator fixture and its baseline metadata.
const fs=require("node:fs"), path=require("node:path"), vm=require("node:vm"), assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const c=vm.createContext({console,assert,crypto:require("node:crypto").webcrypto,atob});
for(const file of ["vendor/gfx.js","vendor/romtools.js","vendor/rom-observer.js","profile.js","author-profile.js","engine.js","workspace-layout.js","asset-editor.js","field-tiles.js","dialogue-layout.js","dialogue.js"])
    vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),c,{filename:file});
c.input=fs.readFileSync(process.argv[2]);
c.fixture=(rom,metadata)=>{
    if(!process.argv[3])return;
    fs.writeFileSync(process.argv[3],rom);
    fs.writeFileSync(process.argv[3]+".json",JSON.stringify(metadata,null,2));
};
vm.runInContext(`(async()=>{
    const original=Uint8Array.from(input), s=await AdvanceRom.open(original);
    const equal=(a,b)=>assert.ok(sameBytes(a,b),"Byte arrays differ");
    const assets=sessionAssets(s);
    let count=0;
    for(let id=0;id<452;id++)if(permitted("monsters",id)){
        const bytes=assets.packed("scripts",id);
        equal(assembleScript(printScript(bytes,original)),bytes);count++;
    }
    assert.equal(count,420);
    for(const source of ["end","attack $F0\\nend\\nend","end\\nend\\nwait","if 1 2\\nend\\nend","end\\nunknown\\nend"])
        assert.throws(()=>assembleScript(source));
    const ai=assembleScript(["variable $1F $19","attack $EE",...Array(72).fill("wait"),"end","end"].join("\\n"));
    assets.set("scripts",260,ai);
    const aiAt=assetKinds.scripts.pool[0];
    const pointer=(rom,kind,id)=>{const spec=assetKinds[kind];return readLE(rom,assetPointer(spec,id),spec.stride)+spec.base;};
    assert.equal(pointer(s.export(),"scripts",260),aiAt);
    s.model.undo();equal(s.export(),original);
    s.model.redo();equal(assets.packed("scripts",260),ai);
    const copy=await AdvanceRom.open(s.export()),again=sessionAssets(copy);
    equal(again.packed("scripts",260),ai);
    again.set("scripts",260,assembleScript("end\\nend"));
    const trimmed=copy.export();equal(trimmed.slice(aiAt,aiAt+2),Uint8Array.of(255,255));
    assert.ok(trimmed.slice(aiAt+2,aiAt+ai.length).every(x=>x===255));
    const shared=assets.store("scripts").rows.findIndex((row,id,all)=>row && all.some((other,j)=>other && j!==id && row.at>=other.at && row.at<other.at+other.size));
    assert.ok(shared>=0);
    const oldShared=assets.store("scripts").rows[shared];
    assets.set("scripts",shared,assembleScript("end\\nend"));
    const detached=s.export();
    assert.notEqual(pointer(detached,"scripts",shared),oldShared.at);
    for(let id=0;id<452;id++)if(id!==shared && id!==260 && permitted("monsters",id)){
        const row=assets.store("scripts").rows[id];equal(detached.subarray(row.at,row.at+row.size),original.subarray(row.at,row.at+row.size));
    }
    s.model.undo();
    let layers=0;
    for(let map=3;map<431;map++)for(let l=0;l<3;l++){
        const info=mapLayerInfo(original,map,l);if(!info.layout)continue;
        assert.ok(unpackLayout(assets.packed("layouts",info.layout)).length);
        const atlas=fieldAtlas(original,map,l);
        assert.equal(atlas.length,256*256*4);assert.ok(atlas.some(v=>v));layers++;
    }
    assert.equal(layers,970);
    for(let map=0;map<3;map++){
        const tiles=unpackLayout(assets.packed("worlds",map)).slice();
        assert.equal(tiles.length,map===2?16384:65536);
        const atlas=worldAtlas(original,map);
        assert.ok(atlas.some((v,i)=>i%4!==3 && v));
        tiles[0]^=1;saveLayer(assets,map,tiles,"worlds");
        const opened=await AdvanceRom.open(s.export());equal(unpackLayout(sessionAssets(opened).packed("worlds",map)),tiles);
        s.model.undo();
    }
    const info=mapLayerInfo(original,415,0),grid=unpackLayout(assets.packed("layouts",info.layout));
    const painted=grid.slice();let n=3751;
    for(let i=0;i<Math.min(256,painted.length);i++){n=(1664525*n+1013904223)>>>0;painted[i]=n>>>24;}
    const x=8,y=8,ix=y*info.width+x;painted[ix]=grid[ix]^1;
    saveLayer(assets,info.layout,painted);
    const out=s.export(),opened=await AdvanceRom.open(out),reader=sessionAssets(opened);
    assert.equal(pointer(out,"layouts",info.layout),assetKinds.layouts.pool[0]);
    equal(unpackLayout(reader.packed("layouts",info.layout)),painted);
    equal(reader.packed("scripts",260),ai);
    const mask=new Uint8Array(original.length);mask.fill(1,0xffdc,0xffe0);
    for(const kind of ["scripts","layouts"])for(const w of assets.plans[kind].writes)mask.fill(1,w.at,w.at+w.bytes.length);
    assert.ok(out.every((v,i)=>v===original[i] || mask[i]));
    fixture(out,{x,y,map:415,layout:info.layout,width:info.width,before:grid[ix],after:painted[ix],aiAt,mapAt:pointer(out,"layouts",info.layout)});
    s.model.undo();s.model.undo();equal(s.export(),original);
    for(const [kind,id,bytes] of [["scripts",260,ai],["layouts",info.layout,reader.packed("layouts",info.layout)]]){
        const dirty=original.slice();dirty[assetKinds[kind].pool[0]+37]=123;
        const blocked=await AdvanceRom.open(dirty);
        assert.throws(()=>sessionAssets(blocked).set(kind,id,bytes),/occupies/);equal(blocked.export(),dirty);
    }
    // Verify each added fixed table against its primary offset, mask and mirror.
    const checks=[["characters",0,"hp",99],["shops",0,"item1",12],["rageMoves",63,"attack1",218],
        ["danceMoves",1,"attack3",12],["controlMoves",100,"attack4",13],["sketchMoves",451,"attack2",13],
        ["naturalMagic",0,"level2",50],["blitzLevels",4,"level",55],["swordLevels",4,"level",57]];
    for(const [key,id,name,value] of checks){
        s.set(key,id,name,value);const t=tables[key],field=t.fields[name],loc=t.start+id*t.width+field.begin;
        const result=s.export();assert.equal(result[loc],value);
        if(t.mirror && id<t.mirror[1])assert.equal(result[t.mirror[0]+id*t.width+field.begin],value);
        const reopened=await AdvanceRom.open(result);assert.equal(reopened.row(key,id)[name].value,value);
        s.model.undo();equal(s.export(),original);
    }
    for(const [key,index] of Object.entries(MAP_OBJECT_INDEX)){
        const t=tables[key];
        for(let id=0;id<t.count;id++){
            const {map,slot}=mapObjectLocation(original,key,id);
            const from=readLE(original,index.pointer+2*map,2),to=readLE(original,index.pointer+2*map+2,2);
            const offset=t.start+id*t.width-index.base;
            assert.ok(from<=offset && offset<to);assert.equal(from+slot*t.width,offset);
        }
        const id=t.count-1,row=s.row(key,id),before=row.x.value;
        s.set(key,id,"x",before^1);const newROM=s.export();
        const base=t.start+id*t.width+t.fields.x.begin;assert.equal(original[base]^newROM[base],1);
        s.model.undo();equal(s.export(),original);
    }
    const pal=s.row("fieldPalettes",0),color=pal.c4.value^63;
    s.set("fieldPalettes",0,"c4",color);assert.equal(readLE(s.export(),0x32c488,2)&32767,color);
    s.model.undo();equal(s.export(),original);
    const dialogue=s.dialogue=new FieldDialogue(s);
    let readable=0,editable=0;
    for(const [key,slots] of Object.entries(TEXT_LAYOUT)){
        for(const [id,[at,cap,refs]] of slots.entries()){
            if(!cap)continue;
            readable++;if(refs===1)editable++;
            const bytes=dialogue.bytes(key,id),parts=fieldTextParts(bytes);
            equal(Uint8Array.from([...parts.flatMap(p=>Array.from(p.bytes)),0]),bytes);
        }
        const id=slots.findIndex(([at,cap,refs])=>refs===1 && cap>25 && fieldTextParts(original.subarray(at,at+cap)).some(p=>p.text?.length>4));
        const before=fieldTextParts(dialogue.bytes(key,id));
        const i=before.findIndex(p=>p.text?.length>4),[at,cap]=slots[id];
        assert.throws(()=>dialogue.replace(key,id,i,"Q".repeat(cap+1)),/slot holds/);
        assert.throws(()=>dialogue.replace(key,id,i,"🙂"),/cannot encode/);
        dialogue.replace(key,id,i,"Hi");
        assert.equal(fieldTextParts(dialogue.bytes(key,id))[i].text,"Hi");
        const out=s.export(),reopened=await AdvanceRom.open(out),fresh=new FieldDialogue(reopened);
        assert.equal(fieldTextParts(fresh.bytes(key,id))[i].text,"Hi");
        assert.ok(out.every((b,off)=>b===original[off] || (off>=at && off<at+cap) || (off>=0xffdc && off<0xffe0)));
        dialogue.replace(key,id,i,before[i].text);equal(s.export(),original);
        s.model.undo();s.model.undo();
    }
    assert.equal(readable,3259);assert.equal(editable,3252);
    console.log("PASS: 5,299 map objects mapped back to their owning map, five object tables edited, palette color edit, 3,259 dialogue entries decoded, three-bank edits, text controls, slot limits and exact undo.");
    console.log("PASS: 420 AI scripts, shared script isolation, script growth/shrink, 970 field layers, three world map round trips, nine added tables, mixed edits, undo/redo, exact write locations, reopen and occupied-space rejection.");
})()`,c).catch(e=>{console.error(e);process.exitCode=1;});
