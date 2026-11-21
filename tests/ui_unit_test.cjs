// DOM event-handler smoke test. Native browser runs use browser_test.py instead.
// node tests/ui_unit_test.cjs path/to/regular.sfc
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'), data=fs.readFileSync(process.argv[2]);
const elements=new Map();
const downloads=[];
class Element {
    constructor(tag) {
        this.tag=tag;this.children=[];this.value='';this.dataset={};this.classList={toggle(){}};
        this.textContent='';this.disabled=false;this.style={};
    }
    set id(value){this._id=value;elements.set(value,this);}
    get id(){return this._id;}
    append(...items){for(const item of items)this.children.push(...(item.tag==='fragment'?item.children:[item]));}
    replaceChildren(...items){this.children=[];this.append(...items);}
    setAttribute(name,value){this[name]=value;}
    before(node){this.beforeNode=node;}
    addEventListener(type,fn){(this.listeners??={})[type]=fn;}
    dispatchEvent(event){this["on"+event.type]?.(event);return this.listeners?.[event.type]?.(event);}

    add(option){this.append(option);if(this.children.length===1)this.value=option.value;}
    get options(){return this.children;}
    getContext(){return {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),fillRect(){},putImageData(){},strokeRect(){},clearRect(){},
        drawImage:(img,...args)=>{
            if(!img.testPixels)return;
            // The native-check fixture uses a single, unscaled PNG source rectangle.
            if(args.length===8)this.crop={img,x:args[0],y:args[1],w:args[2],h:args[3]};
        },
        getImageData:()=>{
            const {img,x,y,w,h}=this.crop;
            const pixels=new Uint8ClampedArray(w*h*4);
            for(let row=0;row<h;row++)for(let col=0;col<w;col++){
                const at=((y+row)*img.naturalWidth+x+col)*4;
                pixels.set(img.testPixels.subarray(at,at+4),4*(row*w+col));
            }
            return {data:pixels};
        }};}
    setPointerCapture(){}
    getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height};}
    click(){if(this.tag==='a')downloads.push(this.download); else this.onclick?.();this.listeners?.click?.();}
    get length(){return this.children.length;}
    get selectedIndex(){return this.children.findIndex(el=>el.value===this.value);}
    set selectedIndex(index){this.value=this.children[index]?.value??'';}
    checkValidity(){return this.value!=='';}
}
class Option extends Element{
    constructor(label,value){super('option');this.value=String(value);this.textContent=label;}
}
let blob;
class FixtureImage {
    async decode(){
        const png=Buffer.from(await blob.arrayBuffer());
        this.naturalWidth=png.readUInt32BE(16);this.naturalHeight=png.readUInt32BE(20);
        // Only the two-pixel unfiltered RGBA fixture used by the browser checks.
        assert.equal(this.naturalWidth,2);assert.equal(this.naturalHeight,1);
        const at=png.indexOf("IDAT"),size=png.readUInt32BE(at-4);
        const scan=require("node:zlib").inflateSync(png.subarray(at+4,at+4+size));
        assert.equal(scan[0],0);this.testPixels=scan.subarray(1);
    }
}
const main=new Element('main');
class Transfer {
    constructor(){this.files=[];this.items={add:file=>this.files.push(file)};}
}

const document={getElementById:id=>elements.get(id),createElement:tag=>new Element(tag),
                querySelector(q){
                    if(q==="main")return main;
                    if(q==="#preview canvas")return elements.get("preview")?.children[0];
                    const key=q.match(/^button\[data-key="(\w+)"\]$/)?.[1];
                    if(key)return elements.get("tabs").children.find(b=>b.dataset.key===key);
                },createDocumentFragment:()=>new Element('fragment')};
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/<(\w+)\b[^>]*?\bid="([^"]+)"[^>]*>/g)){new Element(m[1]).id=m[2];}
const ctx=vm.createContext({document,Option,window:{addEventListener(){}},crypto:crypto.webcrypto,
    console,Blob,Image:FixtureImage,KeyboardEvent:class extends Event{constructor(type,opts){super(type);this.key=opts.key;}},ImageData:class{constructor(data,w,h){this.data=data;this.width=w;this.height=h;}},CustomEvent,File:require("node:buffer").File,Event,DataTransfer:Transfer,navigator:{platform:"unit-test",userAgent:"DOM test double"},atob,setTimeout:()=>{},URL:{createObjectURL:b=>{blob=b;return 'blob:test';},revokeObjectURL(){}},confirm:()=>true});
const el=id=>elements.get(id);
for(const file of Array.from(html.matchAll(/<script defer src="([^"]+)"/g),m=>m[1]))
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
function file(name,bytes){return {name,arrayBuffer:()=>Promise.resolve(Uint8Array.from(bytes).buffer)};}
async function open(name,bytes){await el('rom-file').onchange({target:{files:[file(name,bytes)]}});}
function choose(tab,id){el('tabs').children.find(x=>x.dataset.key===tab).onclick();el('records').value=String(id);el('records').onchange();}
function change(field,value){const input=el('field-'+field);input.value=String(value);input.onchange();}
(async()=>{
    await open('regular.sfc',data);
    assert.equal(el('status').textContent,'regular.sfc · Regular v1.6');
    el('save').click();assert.ok(data.equals(Buffer.from(await blob.arrayBuffer())));
    choose('formations',579);
    assert.equal(el('field-monster6').value,'451');
    assert.equal(el('field-monster6').children.length,421);
    change('monster6',255);
    choose('monsters',451);change('hp',32123);
    choose('loot',451);assert.equal(el('field-rareDrop').children.length,256);
    choose('maps',415);assert.ok(el('field-layout1').disabled);
    el('undo').click();el('redo').click();
    el('save').click();assert.equal(downloads.at(-1),'regular-edited.sfc');
    const output=Buffer.from(await blob.arrayBuffer());
    assert.equal(output.readUInt16LE(0x380000+451*32+8),32123);
    assert.equal(output[0x3022c8+579*15+7],255);
    assert.equal(output[0x3022c8+579*15+14],31);
    await open('edited.sfc',output);choose('formations',579);
    assert.equal(el('field-monster6').value,'255');
    choose('items',270);assert.equal(el('detail').children[0].textContent,'Bone Wrist');
    el('search').value='no-such-item';el('search').oninput();
    assert.equal(el('detail').children[0].textContent,'No matching records');
    choose('items',270);change('name','Den Wrist');
    const equip=el('field-equip0');equip.checked=true;equip.onchange();
    choose('monsters',451);change('name','Frost Wyrm');
    choose('formations',579);
    assert.match(el('field-monster6').children.find(o=>o.value==='451').textContent,/Frost Wyrm/);
    el('save').click();const named=Buffer.from(await blob.arrayBuffer());
    assert.equal(named.readUInt16LE(0x3f6d8)&1,1);
    await open('community.sfc',named);choose('items',270);assert.equal(el('field-name').value,'Den Wrist');
    choose('espers',27);assert.equal(el('field-rate1').disabled,true);
    choose('espers',0);assert.ok(!el('field-spell1').children.some(o=>o.value==='82'));
    choose("monsterScripts",451);
    const applied=el("ai-source").value;
    el("ai-source").value="wait\n"+applied;el("ai-source").oninput();
    choose("items",270);el("save").click();
    assert.match(el("status").textContent,/Apply or discard/);
    assert.equal(el("ai-source").value,"wait\n"+applied);
    el("apply-script").click();el("undo").click();assert.equal(el("ai-source").value,applied);
    choose("mapTiles",415);
    const pal=el("tile-palette"),map=el("tile-map");
    const pointer=(x,y)=>({pointerId:1,clientX:x,clientY:y,button:0,preventDefault(){}});
    pal.onpointerdown(pointer(17,17));pal.onpointermove(pointer(34,34));pal.onpointerup(pointer(34,34));
    map.onpointerdown(pointer(8,8));map.onpointerup(pointer(8,8));
    const tile=offset=>vm.runInContext('unpackLayout(sessionAssets(session).packed("layouts",350))['+offset+']',ctx);
    assert.deepEqual([0,1,32,33].map(tile),[17,18,33,34]);
    el("undo").click();el("redo").click();assert.equal(tile(33),34);
    const nextMap=el("tile-map");nextMap.onpointerdown({...pointer(25,25),button:2});
    nextMap.onpointerdown(pointer(40,8));nextMap.onpointerup(pointer(40,8));assert.equal(tile(2),34);
    choose("fieldPalettes",0);
    const swatch=el("detail").children.at(-1).children[3].children[0];
    swatch.value="#ff0000";swatch.onchange();
    assert.equal(vm.runInContext('session.row("fieldPalettes",0).c3.value',ctx),31);
    choose("denDialogue",0);
    const run=el("detail").children.find(n=>n.tag==="textarea" && n.value.length>2);
    run.value="Hi";run.onchange();assert.equal(run.value,"Hi");
    assert.equal(vm.runInContext('session.dialogue.searchText("denDialogue",0).includes("Hi")',ctx),true);
    // Run the map's actual pointer handlers at scrolled, zoom-independent tile coordinates.
    choose("mapEditor",20);
    const getMapPoint=(x,y)=>{
        const c=el("map-canvas");
        return pointer((x-Number(c.dataset.x))*16+8,(y-Number(c.dataset.y))*16+8);
    };
    const mapPointer=(type,x,y,extra={})=>el("map-canvas")["onpointer"+type]({...getMapPoint(x,y),...extra});
    const tool=name=>{const e=el("map-tool");e.value=name;e.onchange();};
    mapPointer("down",42,25);mapPointer("up",42,25);
    assert.equal(el("map-object").value,"mapNPCs/20/4");
    function descendants(node){return node.children.flatMap(c=>[c,...descendants(c)]);}
    const dialogueRun=descendants(el("detail")).find(q=>q.tag==="textarea" && q.value.includes("So…magic"));
    assert.ok(dialogueRun);dialogueRun.value="Magic!?";dialogueRun.onchange();
    assert.ok(el("map-commands").options[0].textContent.includes("Magic!?"));el("undo").click();
    mapPointer("down",42,25);mapPointer("move",44,26);mapPointer("up",44,26);
    assert.equal(String(el("map-prop-x").value),"44");assert.equal(String(el("map-prop-y").value),"26");
    el("undo").click();assert.equal(String(el("map-prop-x").value),"42");assert.equal(String(el("map-prop-y").value),"25");
    tool("mapTreasure");mapPointer("down",40,25);assert.equal(el("map-object").value,"added/0");
    const cost=el("map-prop-value");cost.value="233";cost.onchange();
    assert.equal(vm.runInContext('mapProject(session).state.objects[0].data.slice(-2)',ctx),"e9");
    el("undo").click();el("undo").click();
    tool("paint");const atlas=el("map-brush");
    atlas.onpointerdown(pointer(17,17));atlas.onpointermove(pointer(34,34));atlas.onpointerup(pointer(34,34));
    function painted(){
        return Array.from(vm.runInContext('(()=>{const r=session.original,l=mapLayerInfo(r,20,0),b=unpackLayout(sessionAssets(session).packed("layouts",l.layout));return [0,1,l.width,l.width+1].map(n=>b[25*l.width+41+n]);})()',ctx));
    }
    const unpainted=painted();
    mapPointer("down",41,25);mapPointer("cancel",41,25);assert.deepEqual(painted(),unpainted);
    mapPointer("down",41,25);mapPointer("up",41,25);assert.deepEqual(painted(),[17,18,33,34]);el("undo").click();
    assert.deepEqual(painted(),unpainted);
    tool("select");mapPointer("down",42,25);mapPointer("up",42,25);
    const mapDraft=el("map-event-source");mapDraft.value="dialogue $0398\nreturn";mapDraft.oninput();
    choose("items",270);el("save").click();
    assert.equal(el("map-object").value,"mapNPCs/20/4");assert.equal(el("map-event-source").value,mapDraft.value);
    el("map-apply-event").click();el("undo").click();
    if(process.argv[3]){
        const retail=fs.readFileSync(process.argv[3]);
        ctx.location={hash:"#browser-test",protocol:"file:",reload(){}};
        vm.runInContext("startLocalBrowserCheck()",ctx);
        let panel=main.beforeNode;
        function picker(){return panel.children[2].children[0].children[0];}
        picker().files=[file("retail.sfc",retail)];await picker().onchange();
        assert.match(panel.children[1].textContent,/checks passed so far/);
        el('save').click();
        const preset=Buffer.from(await blob.arrayBuffer());
        const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
        assert.equal(digest(preset),"f18ce0e68ea9a43f3bd3ae90a6a807f6090cf3b0c24e9088409c7852c1dcc4a0");
        await panel.children[2].children[0].onclick();
        const presetReceipt=ctx.location.hash;
        choose('items',270);change('cost',43210);change('power',100);change('accuracy',100);
        el('save').click();
        const edited=Buffer.from(await blob.arrayBuffer());
        assert.equal(digest(edited),"7ba6dc72285d3287813d2b398bb526706bd112e223d4d9db84bf0b1671364c18");
        // Further in-memory edits without another export must not alter the saved receipt.
        change('cost',123);
        await panel.children[2].children[0].onclick();
        const revision="1."+retail[0xffdb], customReceipt=ctx.location.hash;
        assert.equal(customReceipt,"browser-test-reopen-v07-"+revision+"-"+digest(edited));
        async function reopenStage(receipt,wrong,correct) {
            ctx.location.hash="#"+receipt;
            vm.runInContext("startLocalBrowserCheck()",ctx);panel=main.beforeNode;
            picker().files=[file("same-name.smc",wrong)];await picker().onchange();
            assert.match(panel.children[1].textContent,/differs from your last export/);
            assert.equal(picker().disabled,false);
            picker().files=[file("renamed (2).smc",correct)];await picker().onchange();
            assert.match(panel.children[1].textContent,/^PASS/);
            panel.children[2].children[0].click();
            const report=JSON.parse(await blob.text());
            assert.equal(report.outcome,"PASS");assert.equal(report.platform,"unit-test");
            assert.equal(report.retailRevision,revision);assert.equal(report.editedSHA256,digest(correct));
            assert.equal(report.scriptedEditsSHA256,digest(preset));
        }
        await reopenStage(presetReceipt,edited,preset);
        const reported=process.argv[4]?fs.readFileSync(process.argv[4]):edited;
        assert.ok(reported.equals(edited));
        await reopenStage(customReceipt,preset,reported);
        console.log("PASS: retail import, conflict, native check controls, export bytes, reopen checks and report generation under the DOM test double.");
    }
    console.log('PASS: actual HTML/script wiring and import, select, field change, undo/redo, filter, download and reopen handlers with an in-memory DOM test double.');
})().catch(e=>{console.error(e);process.exitCode=1;});
