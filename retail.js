// Offline US retail import for SNES Advance Regular. GPL-3.0.
"use strict";

const RETAIL_SIZE = 0x300000;
const REGULAR_SHA = "55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059";
const protectedMonsterIds = new Set([367, 372, 380]);

function decode64(value) {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

function applyRetailDelta(source, patch) {
    const end = patch.length - 12;
    const trailer = new DataView(patch.buffer, patch.byteOffset + end, 12);
    if (String.fromCharCode(...patch.subarray(0, 4)) !== "BPS1" ||
        ROM.crc32(patch.subarray(0, patch.length-4)) !== trailer.getUint32(8, true) ||
        ROM.crc32(source) !== trailer.getUint32(0, true)) {
        throw Error("Retail import data failed its checksum. Extract a fresh copy of the editor.");
    }
    let pos = 4;
    function integer() {
        let value = 0;
        let scale = 1;
        while (pos < end && scale <= 2**28) {
            const b = patch[pos++];
            value += (b & 127) * scale;
            if (b >= 128) return value;
            scale *= 128;
            value += scale;
        }
        throw Error("Invalid integer in the retail import patch.");
    }
    if (integer() !== source.length || integer() !== SIZE) throw Error("Invalid retail import patch size.");
    const metadata = integer();
    pos += metadata;
    const out = new Uint8Array(SIZE);
    const relative = [0, 0];
    let written = 0;
    while (pos < end) {
        const command = integer();
        const size = Math.floor(command / 4) + 1;
        const kind = command % 4;
        if (written + size > out.length) throw Error("Retail import patch exceeded its output.");
        if (kind === 1) {
            if (pos + size > end) throw Error("Truncated retail import patch.");
            out.set(patch.subarray(pos, pos+size), written);
            pos += size;
        } else {
            let start = written;
            if (kind >= 2) {
                const offset = integer();
                start = relative[kind-2] + Math.floor(offset/2) * (offset % 2 ? -1 : 1);
                relative[kind-2] = start + size;
            }
            if (kind === 3) {
                if (start < 0 || start >= written) throw Error("Invalid output copy in retail import patch.");
                // BPS permits overlapping copies, including repeated single-byte runs.
                for (let i = 0; i < size; i++) out[written+i] = out[start+i];
            } else {
                if (start < 0 || start+size > source.length) throw Error("Invalid input copy in retail import patch.");
                out.set(source.subarray(start, start+size), written);
            }
        }
        written += size;
    }
    if (pos !== end || written !== SIZE || ROM.crc32(out) !== trailer.getUint32(4, true)) {
        throw Error("The converted Regular template failed its checksum.");
    }
    return out;
}

function visitRetailRows(group, callback) {
    const bits = decode64(group.rows);
    for (let id = 0; id < group.count; id++) {
        if (bits[id >> 3] & (1 << (id & 7))) callback(id, id*group.width);
    }
}

function normalizedRetail(source, profile) {
    const bytes = new Uint8Array(source);
    bytes.fill(0, 0xffdc, 0xffe0);
    for (const group of profile.groups) {
        visitRetailRows(group, (_, offset) => {
            const start = group.source + offset;
            for (let i = 0; i < group.width; i++) bytes[start+i] &= ~group.mask[i];
        });
    }
    return bytes;
}

function checkRetailRow(group, source, id, at) {
    if (group.name === "Field dialogue glyphs" && source[at] < 0x20) {
        throw Error("Field dialogue edit at file "+hex(at, 6)+" replaces a glyph with a control code. Keep the existing dialogue controls and pointers.");
    }
    if (group.name === "Formations") {
        for (let slot = 0; slot < 6; slot++) {
            if (!(source[at+1] & (1 << slot))) continue;
            const monster = source[at+2+slot] + ((source[at+14] >> slot) & 1)*256;
            if (protectedMonsterIds.has(monster) || monster >= 384) {
                throw Error("Formation "+hex(id, 3)+", slot "+(slot+1)+" uses monster "+hex(monster, 3)+". Regular reserves or repurposes that retail ID.");
            }
        }
    }
    if (group.name === "Esper teaching") {
        for (let slot = 0; slot < 5; slot++) {
            const spell = source[at+slot*2+1];
            if (spell >= 54 && spell !== 255) throw Error("Esper "+hex(id, 2)+" uses a spell outside the ordinary retail learning table.");
        }
    }
}

function carryRetailEdits(output, source, profile) {
    for (const group of profile.groups) {
        visitRetailRows(group, (id, offset) => {
            const at = group.source + offset;
            checkRetailRow(group, source, id, at);
            for (const dest of group.destinations) {
                for (let i = 0; i < group.width; i++) {
                    const mask = group.mask[i];
                    output[dest+offset+i] |= source[at+i] & mask;
                }
            }
        });
    }
}

function mismatchPages(bytes, profile) {
    const expected = new DataView(decode64(profile.pages).buffer);
    const first = [];
    let count = 0;
    for (let pos = 0; pos < bytes.length; pos += 256) {
        if (ROM.crc32(bytes.subarray(pos, pos+256)) === expected.getUint32(pos/64, true)) continue;
        if (first.length < 3) first.push(pos);
        count++;
    }
    return {count, first, revision:profile.revision};
}

async function openEditorFile(file) {
    const headerSize = file.length === SIZE+512 || file.length === RETAIL_SIZE+512 ? 512 : 0;
    const payload = file.subarray(headerSize);
    let padded = false;
    if (payload.length === SIZE) {
        const tail = payload.subarray(RETAIL_SIZE);
        padded = (tail[0] === 0 || tail[0] === 255) && tail.every(b => b === tail[0]);
        if (!padded) return {session:await AdvanceRom.open(file)};
    } else if (payload.length !== RETAIL_SIZE) {
        throw Error("Open a 3 MiB Final Fantasy III USA v1.0/v1.1 ROM or a 4 MiB SNES Advance Regular ROM. Both accept a 512-byte copier header.");
    }
    const source = payload.subarray(0,RETAIL_SIZE);
    const candidates = [...RETAIL_DATA].sort((a,b) =>
        Number(b.revision === "1."+source[0xffdb]) - Number(a.revision === "1."+source[0xffdb]));
    const tried = [];
    for (const profile of candidates) {
        const normalized = normalizedRetail(source, profile);
        if (await hashBytes(normalized) !== profile.sourceHash) {
            tried.push({bytes:normalized, profile});
            continue;
        }
        const regular = applyRetailDelta(normalized, decode64(profile.patch));
        if (await hashBytes(regular) !== profile.templateHash) throw Error("Retail import template failed SHA-256 verification.");
        carryRetailEdits(regular, source, profile);
        // The canonical template carries the official checksum. Recalculate after all mirrors are populated.
        updateChecksum(regular);
        const modified = await hashBytes(regular) !== REGULAR_SHA;
        const output = new Uint8Array(SIZE+headerSize);
        output.set(file.subarray(0, headerSize));
        output.set(regular, headerSize);
        return {session:await AdvanceRom.open(output), revision:profile.revision, modified, padded};
    }
    const best = tried.map(({bytes,profile}) => mismatchPages(bytes, profile)).sort((a,b) => a.count-b.count)[0];
    if (best.count === 0 || best.count > 2048) throw Error("Unrecognized retail layout. This importer supports Final Fantasy III USA v1.0 and v1.1.");
    const ranges = best.first.map(p => hex(p,6)+"–"+hex(p+255,6)).join(", ");
    throw Error("Retail conversion stopped. Compared with USA v"+best.revision+", unsupported edits occur in "+
        best.count+" page(s), starting at headerless file offsets "+ranges+". See README.md for supported edits.");
}
