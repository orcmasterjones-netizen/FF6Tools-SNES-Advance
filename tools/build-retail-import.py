"""Build the offline retail import deltas from the official v1.6.5 patches.
Usage: python tools/build-retail-import.py release.zip USA10.sfc USA11.sfc
Inputs are local, headerless reference files. Uses only the Python standard library.
"""
import argparse
import base64
import hashlib
import json
import struct
import zlib
from pathlib import Path
from zipfile import ZipFile

SHA = ["0f51b4fca41b7fd509e4b8f9d543151f68efa5e97b08493e4b2a0c06f5d8d5e2",
       "10eccc5d2fab81346dd759f6be478dcb682eef981e8d3d662da176e1f9a996bc"]
TARGET = "55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059"
REUSED = {367, 372, 380}
DIALOG = 0xd0000
DIALOG_END = 0xeefbb
PAGE = 256


def digest(data):
    return hashlib.sha256(data).hexdigest()


def b64(data):
    return base64.b64encode(data).decode("ascii")


def uint(n):
    out = bytearray()
    while n >= 128:
        out.append(n & 127)
        n = (n >> 7) - 1
    out.append(n | 128)
    return out


def number(data, pos):
    n, shift = 0, 1
    while True:
        b = data[pos]
        pos += 1
        n += (b & 127) * shift
        if b >= 128:
            return n, pos
        shift *= 128
        n += shift


def commands(patch, source):
    if patch[:4] != b"BPS1" or zlib.crc32(patch[:-4]) != int.from_bytes(patch[-4:], "little"):
        raise ValueError("Invalid official BPS file")
    src, p = number(patch, 4)
    size, p = number(patch, p)
    meta, p = number(patch, p)
    if src != len(source) or zlib.crc32(source) != int.from_bytes(patch[-12:-8], "little"):
        raise ValueError("Wrong retail revision for this patch")
    p += meta
    rel = [0, 0]
    output = bytearray()
    ops = []
    while p < len(patch) - 12:
        v, p = number(patch, p)
        kind, length = v & 3, 1 + (v >> 2)
        at = len(output)
        if kind == 0:
            start = at
            output.extend(source[start:start+length])
        elif kind == 1:
            start = p
            output.extend(patch[p:p+length])
            p += length
        else:
            delta, p = number(patch, p)
            start = rel[kind-2] + (delta >> 1) * (-1 if delta & 1 else 1)
            rel[kind-2] = start + length
            if kind == 2:
                output.extend(source[start:start+length])
            else:
                for i in range(start, start+length):
                    output.append(output[i])
        ops.append((kind, at, start, length))
    if len(output) != size or digest(output) != TARGET:
        raise ValueError("The official patch produced an unexpected Regular image")
    return output, ops


def changed_base_patch(source, target, original_ops):
    """Reuse official copy operations wherever they still reproduce the normalized target."""
    out = bytearray(b"BPS1") + uint(len(source)) + uint(len(target)) + uint(0)
    relative = [0, 0]

    def emit(kind, at, start, size):
        out.extend(uint(((size-1) << 2) | kind))
        if kind == 1:
            out.extend(target[at:at+size])
        elif kind >= 2:
            delta = start - relative[kind-2]
            out.extend(uint((abs(delta) << 1) | int(delta < 0)))
            relative[kind-2] = start + size

    for kind, at, start, size in original_ops:
        if kind == 1:
            emit(kind, at, start, size)
            continue
        ref = source if kind in (0, 2) else target
        if ref[start:start+size] == target[at:at+size]:
            emit(kind, at, start, size)
            continue
        begin = 0
        while begin < size:
            matches = ref[start+begin] == target[at+begin]
            end = begin + 1
            while end < size and (ref[start+end] == target[at+end]) == matches:
                end += 1
            emit(kind if matches else 1, at+begin, start+begin, end-begin)
            begin = end

    out.extend(struct.pack("<II", zlib.crc32(source), zlib.crc32(target)))
    out.extend(struct.pack("<I", zlib.crc32(out)))
    return out


def glyph_positions(source, regular):
    # The added-dialogue dispatcher falls back to the retail CD/CE banks for the
    # entire original ID range. Only mark character or DTE bytes in actual strings.
    ptr = 0xce602
    assert source[0xce600:ptr+3084*2] == regular[0xce600:ptr+3084*2]
    assert source[DIALOG:DIALOG_END] == regular[DIALOG:DIALOG_END]
    assert regular[0x7fbf:0x7fc2] == bytes.fromhex("4c6fd6")
    assert bytes.fromhex("a9cd85cbc220a5d00aaabf02e6cc") in regular[0xd66f:0xd6df]
    split = int.from_bytes(source[0xce600:ptr], "little")
    starts = sorted({DIALOG + (0x10000 if i >= split else 0)
                     + struct.unpack_from("<H", source, ptr+2*i)[0] for i in range(3084)})
    glyphs = set()
    for start, end in zip(starts, starts[1:] + [DIALOG_END]):
        pos = start
        marks = []
        while pos < end:
            byte = source[pos]
            if byte == 0:
                glyphs.update(marks)
                break
            if byte >= 0x20:
                marks.append(pos-DIALOG)
            elif byte not in {*range(1, 0x17), 0x19, 0x1a, 0x1b}:
                break
            pos += 2 if byte in (0x11, 0x14, 0x16) else 1
    return glyphs


def build(source, official):
    regular, ops = commands(official, source)
    norm = bytearray(source)
    template = bytearray(regular)
    groups = []

    def group(name, src, width, count, dest, blocked=(), masks=None, allowed=None):
        # Entire retail row must survive in every destination. This protects
        # intentional Advance changes even if a mod alters a different byte in that row.
        mask = bytes(masks) if masks is not None else bytes([255])*width
        bits = bytearray((count+7)//8)
        for row in range(count):
            if row in blocked or (allowed is not None and row not in allowed):
                continue
            offset = row*width
            old = source[src+offset:src+offset+width]
            if any(old != regular[d+offset:d+offset+width] for d in dest):
                continue
            bits[row//8] |= 1 << (row%8)
            for i, flags in enumerate(mask):
                norm[src+offset+i] &= ~flags
                for d in dest:
                    template[d+offset+i] &= ~flags
        groups.append(dict(name=name, source=src, destinations=dest, width=width, count=count,
                           mask=list(mask), rows=b64(bits)))

    group("Internal ROM title", 0xffc0, 21, 1, [0xffc0])
    group("Monster stats", 0xf0000, 32, 384, [0xf0000, 0x380000], REUSED)
    group("Monster loot", 0xf3000, 4, 384, [0xf3000, 0x3844dc], REUSED)
    group("Monster names", 0xfc050, 10, 384, [0xfc050, 0x384bec], REUSED | {382, 383})
    group("Formations", 0xf6200, 15, 576, [0xf6200, 0x3022c8])
    group("Item properties", 0x185000, 30, 255, [0x185000, 0x360269])
    group("Item names and icons", 0x12b300, 13, 255, [0x12b300])
    group("Esper teaching", 0x186e00, 11, 27, [0x186e00])
    group("Magic and summon attacks", 0x46ac0, 14, 81, [0x46ac0])
    map_mask = bytearray(33)
    map_mask[5], map_mask[28] = 128, 255
    group("Map music and random battles", 0x2d8f00, 33, 415, [0x322996], {229, 230}, map_mask)
    group("Field dialogue glyphs", DIALOG, 1, DIALOG_END-DIALOG, [DIALOG],
          allowed=glyph_positions(source, regular))
    norm[0xffdc:0xffe0] = bytes(4)
    checks = b"".join(struct.pack("<I", zlib.crc32(norm[p:p+PAGE])) for p in range(0, len(norm), PAGE))
    patch = changed_base_patch(norm, template, ops)
    return dict(groups=groups, sourceHash=digest(norm), templateHash=digest(template),
                pages=b64(checks), patch=b64(patch))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release", type=Path)
    parser.add_argument("rom", nargs=2, type=Path)
    args = parser.parse_args()
    profiles = []
    with ZipFile(args.release) as release:
        for n, path in enumerate(args.rom):
            data = path.read_bytes()
            if digest(data) != SHA[n]:
                raise SystemExit(f"Expected clean headerless USA v1.{n}")
            name = next(s for s in release.namelist() if s.endswith(f"/Patches/Regular_from_USA_v1.{n}.bps"))
            profile = build(data, release.read(name))
            profiles.append(dict(revision=f"1.{n}", **profile))
    file = Path(__file__).resolve().parents[1] / "retail-data.js"
    file.write_text("// Generated by tools/build-retail-import.py from v1.6.5.\nconst RETAIL_DATA = "
                    + json.dumps(profiles, separators=(",", ":")) + ";\n", encoding="ascii")
