// GPL-3.0. Node tests for modified Regular ROMs, names, wearable masks and previews.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),source=fs.readFileSync(process.argv[2]);
const c=vm.createContext({console,crypto:require('node:crypto').webcrypto});
for(const f of ['vendor/gfx.js','vendor/romtools.js','vendor/rom-observer.js','profile.js','author-profile.js','engine.js','formation-preview.js'])
    vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const api=vm.runInContext('({open:b=>AdvanceRom.open(Uint8Array.from(b)),words:equipMenuWords,checks:LAYOUT_CHECKS,slots:previewSlots,permitted,artwork,fieldChoices})',c);
const same=(a,b)=>assert.ok(Buffer.from(a).equals(Buffer.from(b)));
(async()=>{
    const x=await api.open(source);
    for(const group of api.checks) {
        const sites=group.operands?Object.values(group.operands).flat():[group.at];
        for(const at of sites){
            const m=Buffer.from(source);m[at]^=1;
            await assert.rejects(api.open(m),e=>e.message.includes(group.name));
        }
    }
    for(let i=0;i<15;i++){
        const id=256+i, at=0x360269+id*30+1, menu=api.words[i];
        const original=source.readUInt16LE(at);
        assert.equal(original,source.readUInt16LE(menu));
        for(let j=0;j<14;j++) x.set('items',id,'equip'+j,!(original&(1<<j)));
        const edited=Buffer.from(x.export());
        assert.equal(edited.readUInt16LE(at),original^0x3fff);
        assert.equal(edited.readUInt16LE(menu),original^0x3fff);
        const reloaded=await api.open(edited);assert.equal(Boolean(reloaded.row('items',id).equip0.value),!(original&1));
        for(let j=0;j<14;j++)x.model.undo();
        same(x.export(),source);
        const mismatch=Buffer.from(source);mismatch[menu]^=1;await assert.rejects(api.open(mismatch),/equipment mask conflict/);
    }
    for(const [key,id,len] of [['items',0,12],['items',254,12],['items',256,12],['items',270,12],['monsters',6,10],['monsters',451,10]]){
        const orig=x.name(key,id);
        assert.throws(()=>x.rename(key,id,'A'.repeat(len+1)));assert.throws(()=>x.rename(key,id,'☃'));
        x.rename(key,id,'A'.repeat(len));assert.equal(x.name(key,id),'A'.repeat(len));
        x.model.undo();assert.equal(x.name(key,id),orig);same(x.export(),source);
        x.model.redo();const bytes=Buffer.from(x.export());const reopened=await api.open(bytes);
        assert.equal(reopened.name(key,id),'A'.repeat(len));
        const info=x.nameInfo(key,id);if(key==='items')assert.equal(source[info.t.start+(id<256?id:id-256)*13],bytes[info.t.start+(id<256?id:id-256)*13]);
        if(key==='monsters' && id<384)same(bytes.subarray(0xfc050+10*id,0xfc05a+10*id),bytes.subarray(0x384bec+10*id,0x384bf6+10*id));
        x.model.undo();
    }
    assert.equal(x.name('monsters',6),'Mag Roader');assert.throws(()=>x.rename('monsters',382,'abc'));
    const form=api.slots(x,640)[0];assert.equal(form.monster,443);assert.equal(form.x,16);assert.equal(form.y,24);
    assert.equal(form.sprite.pixels,0x34b13c);assert.equal(form.sprite.width,120);
    for(let id=0;id<645;id++) {
        for(const row of api.slots(x,id))if(row.sprite){
            assert.ok(row.sprite.tiles<=256 && row.sprite.rgba.length===row.sprite.size**2*4);
        }
    }
    for(const [id,field,val] of [[0,'spell1',82],[27,'rate1',7],[29,'spell2',1],[30,'rate2',8]])
        assert.throws(()=>x.set('espers',id,field,val));
    same(x.export(),source);
    console.log('PASS: mutations at every profiled reader, all 210 added equip toggles and both copies, protected flag bits, names/undo/icons/mirrors, all formation previews, fixed Esper awards.');
})().catch(e=>{console.error(e);process.exitCode=1});
