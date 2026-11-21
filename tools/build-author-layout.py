"""Generate Regular's authoring metadata. Usage: python tools/build-author-layout.py Regular.sfc ff3u-sfc.json battle_event_script.inc"""
import hashlib
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
rom = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(rom).hexdigest() != "55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059":
    raise SystemExit("Supply clean, headerless SNES Advance Regular v1.6.5.")
definition = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
source = (root / "project.js").read_text(encoding="utf-8")
directories = source.split("const OBJECT_DIRS=", 1)[1].split("function writeLE", 1)[0]
sites = [n for n in (int(v, 16) for v in re.findall(r"0x[0-9a-f]+", directories)) if n < 0x300000]
sites += [0x1cbf,0x2892,0x289f,0x28e6,0x28f3,0x293c,0x2949,0xbffe,0xc007,0xc010,0x1cd5,0x1fd62]
operands = {n: int.from_bytes(rom[n+1:n+4], "little") for n in sites}
ops = {}
for name, cmd in definition["scriptEncoding"]["event"]["command"].items():
    spans = cmd["opcode"] if isinstance(cmd["opcode"], list) else [cmd["opcode"]]
    for span in spans:
        bounds = [int(v, 0) for v in span.split("-")]
        for op in (range(*bounds) if len(bounds) == 2 else bounds):
            if op <= 255:
                ops[op] = [name, cmd.get("length", 1), cmd["name"]]
event_names = re.findall(r"^\s{8}([A-Z][A-Z_0-9]+)\s+;", Path(sys.argv[3]).read_text(), re.M)
event_names = [name for name in event_names if name != "COUNT"]
if len(event_names) != 33:
    raise SystemExit("Expected the disassembly's 33 named battle events.")
def labels(table):
    values=definition["assembly"][table]["stringTable"]["string"]
    return {int(k,0):v for k,v in values.items() if "-" not in k and "<" not in v}
# Keep each writable monster sprite inside its verified native allocation.
def word(at): return int.from_bytes(rom[at:at+2],"little")
art = {}
for i in [*range(384), *range(416,452)]:
    if i == 262: continue
    rec=0x386f3c+5*i
    packed=word(rec)
    off=(packed & 32767)*8
    at=0x297000+off
    if 0x3f800 <= off < 0x3fe00:
        op=0x301768+13+17*((0x3fd00-(off&0x3ff00))>>8)
        at=rom[op]+(rom[op+4]<<8)+((rom[op+8]&63)<<16)
    side=16 if rom[rec+2]&128 else 8
    mask=0x120000+word(0x12a822 if side==16 else 0x12a820)+rom[rec+4]*side*side//8
    planes=3 if packed&32768 else 4
    size=sum(b.bit_count() for b in rom[mask:mask+side*side//8])*planes*8
    art[i]=[at,size]
metatiles=[]
for i in range(75):
    ptr=0x1fba00+3*i
    start=0x1e0000+int.from_bytes(rom[ptr:ptr+3],"little")
    metatiles.append([start,word(start)])
values={"METATILE_SLOTS":metatiles,"PROJECT_OPERANDS":operands,"FIELD_OPS":ops,"BATTLE_NAMES":[n.replace("_"," ").title() for n in event_names],
        "ANIMATION_NAMES":labels("attackAnimationProperties"),"RESOURCE_NAMES":labels("attackGraphicsProperties"),"MONSTER_ART_SLOTS":art}
(root/"author-layout.js").write_text("// Generated Regular authoring metadata. GPL-3.0.\n"+"".join(
    "const "+k+"="+json.dumps(v,ensure_ascii=False,separators=(",",":"))+";\n" for k,v in values.items()),encoding="utf-8")
