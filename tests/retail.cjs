// End-to-end retail import checks. Supply USA v1.0, USA v1.1, then clean Regular.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const assert = require("node:assert/strict"), crypto = require("node:crypto");
const root = path.join(__dirname, "..");
const context = vm.createContext({console, atob, crypto:crypto.webcrypto});
for (const f of ["vendor/gfx.js","vendor/romtools.js","vendor/rom-observer.js","profile.js","author-profile.js","engine.js","retail-data.js","retail.js"])
    vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), context, {filename:f});
const open = vm.runInContext("data => openEditorFile(Uint8Array.from(data))", context);
const regular = fs.readFileSync(process.argv[4]);
const hash = b => crypto.createHash("sha256").update(b).digest("hex");
const same = (a,b) => assert.equal(hash(a), hash(b));
assert.equal(hash(regular), "55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059");

function checksum(bytes) {
    bytes.writeUInt32LE(0xffff, 0xffdc);
    const sum = bytes.reduce((n, b) => n+b, 0) & 0xffff;
    bytes.writeUInt16LE(sum ^ 0xffff, 0xffdc);
    bytes.writeUInt16LE(sum, 0xffde);
}

async function test(revision, file) {
    const src = fs.readFileSync(file);
    const retailHash = hash(src);
    const header = Buffer.from(Array.from({length:512}, (_,i) => (i*37)&255));
    for (const prefix of [Buffer.alloc(0),header]) {
        const clean = await open(Buffer.concat([prefix, src]));
        assert.equal(clean.revision, revision);
        assert.equal(clean.modified, false);
        same(clean.session.export(), Buffer.concat([prefix, regular]));
    }

    const mod = Buffer.from(src);
    const expected = Buffer.from(regular);
    // Independently specify both the legacy addresses and the active Regular destinations.
    function put(source, destinations, value) {
        const bytes = Buffer.from(value);
        bytes.copy(mod, source);
        for (const dest of destinations) bytes.copy(expected, dest);
    }
    put(0xffc0, [0xffc0], Buffer.from("MY ADVENTURE", "ascii"));
    const hp = 260*32+8;
    put(0xf0000+hp, [0xf0000+hp,0x380000+hp], [0x39, 0x30]);
    put(0xf3000+260*4+2, [0xf3000+260*4+2,0x3844dc+260*4+2], [0xfb,0xfb]);
    put(0xfc050, [0xfc050,0x384bec], [0x80,0x81]);
    put(0xf6200+8, [0xf6200+8,0x3022c8+8], [0x64]);
    put(0x12b300+1, [0x12b300+1], [0x80]);
    put(0x186e00, [0x186e00], [7,10]);
    put(0x46ac0+5, [0x46ac0+5], [55]);
    put(0x46db4+6, [0x46db4+6], [93]);
    put(0x2d8f00+28, [0x322996+28], [7]);
    put(0x2d8f00+5, [0x322996+5], [src[0x2d8f00+5]^128]);
    put(0xd0000, [0xd0000], [0x20]);
    for (let i = 0; i < 255; i++) {
        const at = i*30+28;
        put(0x185000+at, [0x185000+at,0x360269+at], [i,42]);
    }
    mod.fill(0x12, 0xffdc, 0xffe0);
    checksum(expected);
    const priorMod = hash(mod);
    for (const prefix of [Buffer.alloc(0),header]) {
        const converted = await open(Buffer.concat([prefix,mod]));
        assert.equal(converted.revision, revision);
        assert.equal(converted.modified, true);
        const result = Buffer.from(converted.session.export());
        same(result, Buffer.concat([prefix,expected]));
        const reopened = await open(result);
        assert.equal(reopened.revision, undefined);
        assert.equal(reopened.session.row("monsters",260).hp.value,12345);
        reopened.session.set("monsters",260,"hp",21543);
        const second = Buffer.from(result);
        const payload = second.subarray(prefix.length);
        for (const start of [0xf0000,0x380000]) payload.writeUInt16LE(21543,start+hp);
        checksum(payload);
        same(reopened.session.export(),second);
    }
    for (const [prefix, fill] of [[header,0xff],[Buffer.alloc(0),0]]) {
        const padded = Buffer.concat([prefix,mod,Buffer.alloc(0x100000,fill)]);
        const result = await open(padded);
        assert.equal(result.padded,true);
        same(result.session.export(),Buffer.concat([prefix,expected]));
        padded[padded.length-1] ^= 1;
        await assert.rejects(open(padded));
    }
    assert.equal(hash(src),retailHash);
    assert.equal(hash(mod),priorMod);
    if (process.env.FF6_TEST_IMPORT_ROM && revision === "1.1")
        fs.writeFileSync(process.env.FF6_TEST_IMPORT_ROM,(await open(mod)).session.export(), {flag:"wx"});

    for (const [site, error] of [
        [0x25504,/unsupported edits.*025500/], [0xf0000+367*32,/unsupported edits/],
        [0xfc050+382*10,/unsupported edits/], [0x185000+255*30,/unsupported edits/],
        [0x2d8f00+229*33+28,/unsupported edits/], [0x2d8f00+5,/unsupported edits/],
        [0xce603,/unsupported edits/], [0xd0012,/unsupported edits/]
    ]) {
        const bad = Buffer.from(mod);
        bad[site] ^= 1;
        await assert.rejects(open(bad),error);
    }
    const unsafeFormation = Buffer.from(mod);
    unsafeFormation[0xf6200+2] = 111;
    unsafeFormation[0xf6200+14] |= 1;
    await assert.rejects(open(unsafeFormation), /Formation.*16F/);
    const unsafeGlyph = Buffer.from(mod);
    unsafeGlyph[0xd0000] = 0x13;
    await assert.rejects(open(unsafeGlyph), /glyph with a control/);
    const unsafeSpell = Buffer.from(mod);
    unsafeSpell[0x186e01] = 82;
    await assert.rejects(open(unsafeSpell), /ordinary retail learning/);
    console.log("PASS USA v"+revision+": clean and modified, headerless and headered, all eleven import groups, 255 item prices, exact complete outputs, reopen/edit, conflicts and reserved IDs.");
}
(async () => {
    await test("1.0", process.argv[2]);
    await test("1.1", process.argv[3]);
    await assert.rejects(open(Buffer.alloc(0x300000)), /Unrecognized retail layout/);
    await assert.rejects(open(Buffer.alloc(0x10000)), /3 MiB/);
})().catch(e => {console.error(e);process.exitCode=1;});
