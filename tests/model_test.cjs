// Test the shipping FF6Tools model without a browser. GPL-3.0, 2026-11-21.
// node tests/model_test.cjs path/to/regular.sfc [edited-output.sfc]
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.join(__dirname,'..');
const source = fs.readFileSync(process.argv[2]);
const context = vm.createContext({console,crypto:crypto.webcrypto});
for (const name of ['vendor/gfx.js','vendor/romtools.js','vendor/rom-observer.js','profile.js','author-profile.js','engine.js'])
    vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
const {open,ids,label} = vm.runInContext('({open:bytes=>AdvanceRom.open(Uint8Array.from(bytes)), ids:permitted,label:recordLabel})',context);
const equal=(a,b)=>assert.ok(Buffer.from(a).equals(Buffer.from(b)),'byte comparison');
(async()=>{
    const rom=await open(source);
    equal(rom.export(),source);
    for(const [key,n] of Object.entries({items:270,monsters:420,loot:420,formations:645,espers:31,magic:54,addedMagic:3,summons:27,addedSummons:7,maps:431})) {
        const arr=rom.model[key];let seen=0;
        for(let i=0;i<arr.arrayLength;i++)if(ids(key,i)){
            const row=rom.row(key,i);assert.ok(row.range.length);seen++;
        }
        assert.equal(seen,n,key);
    }
    equal(rom.export(),source);
    assert.equal(rom.row('formations',579).monster6.value,451);
    assert.match(label(rom.original,'monsters',451),/Ice Dragon/);
    assert.match(label(rom.original,'items',270),/Bone Wrist/);
    assert.equal(rom.row('espers',27).spell1.value,82);
    assert.deepEqual([0,1,2].map(i=>rom.row('addedMagic',i).mpCost.value),[70,20,60]);
    assert.equal(rom.row('maps',415).layout1.value,350);
    assert.equal(rom.row('maps',415).layout2.value,351);
    for(const [key,id,field,val] of [
        ['formations',579,'monster6',384],['formations',579,'monster6',452],
        ['loot',451,'rareDrop',256],['espers',30,'spell5',54],
        ['items',255,'cost',1],['monsters',384,'hp',1],['maps',415,'layout1',350],
        ['monsters',451,'hp',65536],['formations',644,'monster1X',7]])
        assert.throws(()=>rom.set(key,id,field,val));
    const roster=Object.keys(rom.domains.roster).map(Number);
    assert.equal(roster.length,421);assert.ok(roster.includes(255)&&roster.includes(451)&&roster.includes(511));
    assert.ok(!roster.some(id=>id>=384 && id<416));assert.equal(Object.keys(rom.domains.loot).length,256);
    assert.equal(Object.keys(rom.domains.teaching).length,58);
    for(let slot=0;slot<6;slot++){
        const key='monster'+(slot+1), at=0x3022c8+579*15;
        for(const id of [255,256,451]){
            rom.set('formations',579,key,id);
            const bytes=rom.export();
            assert.equal(bytes[at+2+slot],id&255);
            const bit=1<<slot;
            assert.equal(bytes[at+14],(source[at+14]&~bit)|((id>>8)<<slot));
            const reload=await open(bytes);
            assert.equal(reload.row('formations',579)[key].value,id);
            if(rom.model.undoStack.length) rom.model.undo();
            equal(rom.export(),source);
        }
    }
    rom.set('formations',579,'monster6',511);
    assert.equal(rom.row('formations',579).monster6Present.value,false);
    assert.throws(()=>rom.set('formations',579,'monster6Present',true));
    rom.model.undo();equal(rom.export(),source);
    rom.model.redo();assert.equal(rom.row('formations',579).monster6.value,511);
    rom.model.undo();
    const expected=Buffer.from(source);
    function edit(key,id,field,value,addresses,width=1) {
        rom.set(key,id,field,value);
        for(const a of addresses)expected.writeUIntLE(value,a,width);
    }
    edit('monsters',451,'hp',32123,[0x380000+451*32+8],2);
    rom.set('formations',644,'monster1',451);
    expected[0x3022c8+644*15+2]=195;
    edit('items',270,'cost',3210,[0x360269+270*30+28],2);
    edit('items',0,'cost',4321,[0x360269+28,0x185000+28],2);
    edit('loot',451,'rareDrop',254,[0x3844dc+451*4+2]);
    edit('espers',30,'spell5',10,[0x186e00+30*11+9]);
    edit('espers',30,'rate5',6,[0x186e00+30*11+8]);
    edit('addedMagic',2,'mpCost',37,[0x3018a6+5]);
    edit('addedSummons',0,'spellPower',77,[0x301828+6]);
    edit('maps',415,'song',6,[0x322996+415*33+28]);
    edit('maps',430,'song',7,[0x322996+430*33+28]);
    const final=Buffer.from(rom.export());
    final.copy(expected,0xffdc,0xffdc,0xffe0);
    equal(final,expected);
    assert.equal(final.readUInt16LE(0xffdc)^final.readUInt16LE(0xffde),65535);
    assert.equal(final.reduce((a,b)=>a+b,0)&65535,final.readUInt16LE(0xffde));
    const reopened=await open(final);
    assert.equal(reopened.row('formations',644).monster1.value,451);
    assert.equal(reopened.row('monsters',451).hp.value,32123);
    assert.equal(reopened.row('items',270).cost.value,3210);
    assert.equal(reopened.row('addedMagic',2).mpCost.value,37);
    reopened.set('monsters',451,'hp',31987);
    assert.equal(Buffer.from(reopened.export()).readUInt16LE(0x380000+451*32+8),31987);
    const header=Buffer.from(Array.from({length:512},(_,i)=>i&255));
    const headered=Buffer.concat([header,source]);const h=await open(headered);
    equal(h.export(),headered);h.set('monsters',451,'hp',32123);equal(h.export().slice(0,512),header);
    const external=Buffer.from(source);
    external[0x360080+14*13+1]=0x92;
    external[0x10000]^=1;
    const mixed=await open(external);equal(mixed.export(),external);
    mixed.set('items',270,'cost',3456);
    const mixedOutput=Buffer.from(mixed.export());
    const mixedExpect=Buffer.from(external);mixedExpect.writeUInt16LE(3456,0x360269+270*30+28);
    mixedOutput.copy(mixedExpect,0xffdc,0xffdc,0xffe0);equal(mixedOutput,mixedExpect);
    const mixedAgain=await open(mixedOutput);assert.match(label(mixedAgain.original,'items',270),/Sone Wrist/);
    const moved=Buffer.from(source);moved[0x25504]^=1;
    await assert.rejects(open(moved),/Item properties layout conflict.*C25503/);
    const rerouted=Buffer.from(source);rerouted[0x22967]^=1;
    await assert.rejects(open(rerouted),/dispatch entry layout conflict/);
    const mismatch=Buffer.from(source);mismatch[0x185000+28]^=1;await assert.rejects(open(mismatch),/Item properties mirror conflict/);
    await assert.rejects(open(source.subarray(0,0x300000)));
    if(process.argv[3])fs.writeFileSync(process.argv[3],final);
    console.log('PASS: all record ranges, fully loaded no-op, six split-ID slots across $FF/$100/$1C3, empty slot, domain restrictions, mirrored records, exact edit diffs, checksum, reopen/edit, header preservation, incompatible inputs.');
})().catch(e=>{console.error(e);process.exitCode=1;});
