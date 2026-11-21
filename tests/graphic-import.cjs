// Run with node tests/graphic-import.cjs Regular.sfc [emulator-fixture.sfc].
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.join(__dirname,".."),html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const context=vm.createContext({console,assert,atob,crypto:require("node:crypto").webcrypto,input:fs.readFileSync(process.argv[2]),
    save:bytes=>{if(process.argv[3])fs.writeFileSync(process.argv[3],bytes);}});
for(const [,file] of html.matchAll(/<script defer src="([^"]+)"/g)){
    if(file==="ui.js")break;
    vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),context,{filename:file});
}
async function run(){
    const orig=Uint8Array.from(input),s=await AdvanceRom.open(orig);
    const equal=(a,b)=>assert.ok(sameBytes(a,b),"Arrays differ");
    const rgba=(...colors)=>Uint8ClampedArray.from(colors.flat());
    const red=[255,0,0,255],green=[0,255,0,255],clear=[255,255,255,0];
    const tiny={w:4,h:2,bpp:2,indices:Uint8Array.of(1,2,3,2,2,2,2,2),positions:[[0,0]],colors:[[0,0,0],[255,0,0],[0,0,255],[0,255,0]]};
    const source={width:3,height:2,pixels:rgba(clear,clear,clear,clear,green,red)};
    const area={sx:1,sy:1,w:2,h:1,dx:1,dy:0};
    const crop=planGraphicImport(tiny,source,area,"exact");
    equal(crop.indices,Uint8Array.of(1,3,1,2,2,2,2,2));
    for(const prop of ["sx","sy","dx","dy","w","h"])assert.throws(()=>planGraphicImport(tiny,source,{...area,[prop]:-1},"exact"));
    const yellow={width:1,height:1,pixels:rgba([254,252,0,255])},one={sx:0,sy:0,w:1,h:1,dx:2,dy:0};
    assert.throws(()=>planGraphicImport(tiny,yellow,one,"exact"),/outside/);
    const near=planGraphicImport(tiny,yellow,one,"nearest");
    assert.equal(near.changed.length,0);assert.equal(near.approximated,1);
    const gray=planGraphicImport(tiny,{width:1,height:1,pixels:rgba([170,170,170,255])},one,"index");
    assert.equal(gray.indices[2],2);assert.equal(gray.changed.length,0);
    const gen=planGraphicImport(tiny,yellow,one,"generate");
    assert.deepEqual(gen.changed,[3]);assert.equal(gen.words[3],1023);assert.equal(gen.words[0],0);
    assert.equal(gen.approximated,0);equal(gen.indices,tiny.indices);
    const locked=planGraphicImport({...tiny,indices:Uint8Array.of(1,2,1,3,2,2,2,2)},yellow,one,"generate");
    assert.equal(locked.changed.length,0);assert.equal(locked.approximated,1);
    const black=planGraphicImport(tiny,{width:1,height:1,pixels:rgba([0,0,0,255])},one,"generate");
    assert.ok(black.indices[2]>0);assert.equal(black.words[black.indices[2]],0);
    const transparent=planGraphicImport(tiny,{width:1,height:1,pixels:rgba(clear)},one,"generate");
    assert.equal(transparent.indices[2],0);assert.equal(transparent.changed.length,0);
    const colors=new Map(Array.from({length:480},(_,i)=>[(i*269)%32768,1+i%9]));
    const reduced=reducedColors(colors,3);assert.equal(reduced.length,3);assert.deepEqual(reduced,reducedColors(colors,3));
    let count=0;const pairs=[["monster",14],["monster",451],["sprite",0],["tiles",0],["layer3",1],["world",0],["world",1],["world",2]];
    const depths=new Set();
    for(const [kind,id] of pairs){
        const args=[s,kind,id,0,0],sheet=graphicSheet(...args),full={sx:0,sy:0,w:sheet.w,h:sheet.h,dx:0,dy:0};
        const pixels=sheetRGBA(sheet);
        for(let i=0;i<sheet.indices.length;i++)if(sheet.indices[i])pixels.set([(i*3)&255,(i*37)&255,(i*17)&255,255],i*4);
        const plan=planGraphicImport(sheet,{width:sheet.w,height:sheet.h,pixels},full,"generate");
        assert.ok(plan.changed.length && plan.changedPixels && plan.approximated);
        assert.ok(!plan.changed.includes(0));depths.add(sheet.bpp);
        const history=s.model.undoStack.length;
        applyGraphicImport(...args,plan);assert.equal(s.model.undoStack.length,history+1);
        equal(graphicSheet(...args).colors.map(colorWord),plan.words);
        const output=s.export(),copy=await AdvanceRom.open(output),reloaded=graphicSheet(copy,kind,id,0,0);
        equal(output,copy.export());equal(reloaded.indices,plan.indices);equal(reloaded.colors.map(colorWord),plan.words);
        if(kind==="tiles" || kind==="layer3"){
            const slot=plan.changed[0];assert.equal(s.row("fieldPalettes",0)["c"+slot].value,plan.words[slot]);
            s.set("fieldPalettes",0,"c"+slot,plan.words[slot]^1);
            assert.equal(colorWord(graphicSheet(...args).colors[slot]),plan.words[slot]^1);s.model.undo();
        }
        assert.throws(()=>applyGraphicImport(...args,plan),/destination changed/i);
        s.model.undo();equal(s.export(),orig);s.model.redo();equal(s.export(),output);s.model.undo();count++;
    }
    assert.equal(depths.size,3);
    // Force a packing failure after generated colors have been applied to the field palette.
    // The previous branch of redo history and every ROM byte must survive.
    const occupied=orig.slice();occupied[PROJECT_ARENA]=7;
    const c=await AdvanceRom.open(occupied);
    c.set("monsters",260,"hp",23456);c.model.undo();
    const target=[c,"layer3",1,0,0],layer=graphicSheet(...target),pix=sheetRGBA(layer);
    for(let i=0;i<layer.indices.length;i++)if(layer.indices[i])pix.set(red,4*i);
    const p=planGraphicImport(layer,{width:layer.w,height:layer.h,pixels:pix},{sx:0,sy:0,dx:0,dy:0,w:layer.w,h:layer.h},"generate");
    assert.ok(p.changed.length && p.changedPixels);
    assert.throws(()=>applyGraphicImport(...target,p),/occupied/);equal(c.export(),occupied);
    assert.equal(c.model.undoStack.length,0);c.model.redo();assert.equal(c.row("monsters",260).hp.value,23456);
    c.model.beginAction();c.set("monsters",260,"hp",12345);
    assert.throws(()=>applyGraphicImport(...target,p),/occupied/);c.model.endAction();
    assert.equal(c.row("monsters",260).hp.value,12345);c.model.undo();assert.equal(c.row("monsters",260).hp.value,23456);
    // Produce a visible TunnelArmr recolor and check that the palette used by the formation view follows it.
    const args=[s,"monster",260,0,0],boss=graphicSheet(...args),art=sheetRGBA(boss);
    for(let i=0;i<boss.indices.length;i++)if(boss.indices[i])art.set(boss.indices[i]%2?[0,255,255,255]:[255,0,255,255],i*4);
    const plan=planGraphicImport(boss,{width:boss.w,height:boss.h,pixels:art},{sx:0,sy:0,w:boss.w,h:boss.h,dx:0,dy:0},"generate");
    applyGraphicImport(...args,plan);
    equal(artwork(s.export(),260).rgba,sheetRGBA(graphicSheet(...args)).map((v,i)=>i%4!==3 && !art[i-i%4+3]?0:v));
    save(s.export());
    console.log("PASS: non-origin source crop and destination, locked and shared colors, exact/nearest/index behavior, deterministic reduction, 2/3/4 bpp, "+count+" export/reopen/undo/redo cases, atomic rollback and field palette integration.");
}
vm.runInContext("("+run.toString()+")()",context).catch(e=>{console.error(e);process.exitCode=1;});
