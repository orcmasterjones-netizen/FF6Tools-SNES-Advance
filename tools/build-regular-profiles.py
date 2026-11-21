"""Regenerate the Regular asset and dialogue catalogues and the extra native profiles.

Usage: python tools/build-regular-profiles.py clean-Regular.sfc upstream/ff6/ff3u-sfc.json
Uses the upstream definition at commit 5390cef7f13483681fa8b43f39a38c05a497946a.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys

out = Path(__file__).resolve().parents[1]
rom = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(rom).hexdigest() != "55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059":
    raise SystemExit("Supply the clean, headerless Regular v1.6.5 image.")
definition = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))


def build_storage_and_tables():
    r=rom
    d=definition
    def u(i,n):return int.from_bytes(r[i:i+n],'little')
    # Normal and retaliation end in separate opcode FFs. FF inside operands is ordinary data.
    sizes=r[0x21daf:0x21dbf];scripts=[]
    for i in range(452):
     p=u(0x387810+2*i,2)
     if p==65535:scripts.append(None);continue
     start=0x390000+p;a=start;ends=0
     while ends<2:
      b=r[a];a+=1 if b<240 else sizes[b-240];ends+=b==255
     assert a<=0x395600
     scripts.append([start,a-start])
    layouts=[]
    for i in range(389):
     a=0x19d1b0+u(0x30076a+3*i,3);n=u(a,2)
     assert 2<n<0xffff
     layouts.append([a,n])
    assert r[0x395600:0x39fff0]==b'\xff'*(0x39fff0-0x395600)
    assert r[0x330000:0x33e000]==b'\xff'*0xe000
    # Capture exact instructions including addressing mode; masks are not inferred from lookalike data.
    groups={}
    def guard(key,sites):
     by={}
     for a,n in sites:by.setdefault(r[a:a+n].hex(),[]).append(a)
     groups[key]=by
    guard('Monster AI',[(0x21a44,4),(0x21a64,4),(0x21a6b,4),(0x22d77,4),(0x22d88,4),(0x21daf,16)])
    guard('Field tiles',[(0x1cbf,4),(0x266c,4),(0x26f6,4),(0x27ef,4),(0x2840,4),(0x2776,4)]+[(i,22) for i in [0x2892,0x28e6,0x293c]])
    worldsites=[0x2eb20f,0x2eb224,0x2eb227]
    worlds=[]
    for at in worldsites:
     addr=u(at,3)-0xc00000
     worlds.append([addr,u(addr,2)])
    assert set(r[0x314200:0x31ff00])=={255}
    guard('World tiles',[(0x2eb212,3),(0x2eb21e,3),(0x2eb22a,3)])
    command=d['scriptEncoding']['monster']['command']
    labels={}
    for name,source in [('condition',command['conditional']),('effect',command['misc'])]:
     for field in source['assembly'].values():
      v=field.get('stringTable',{})
      if isinstance(v,dict) and v.get('string') and field.get('begin')==1:
       labels[name]={int(k,0):s for k,s in v['string'].items() if '-' not in k}
       break
    labels['target']={int(k,0):s for k,s in d['stringTable']['battleTargets']['string'].items() if '-' not in k}
    data={'scripts':scripts,'layouts':layouts,'worlds':worlds,'guards':groups,'labels':labels}
    (out/'workspace-layout.js').write_text('// Regular v1.6.5 asset locations and lengths, headerless file offsets.\nconst WORK_LAYOUT='+json.dumps(data,separators=(',',':'))+';\n')
    extra={}
    def table(key,src,start,width,count,mirror=None):
     v=d['assembly'][src]['assembly']
     fields=v.get('assembly',{'level':v})
     fs={}
     for k,x in fields.items():
      if not isinstance(x,dict) or x.get('type')!='property' or x.get('flag') or k in ['runFactor','levelModifier']:continue
      f={n:x[n] for n in ['name','bool','max','mask','begin'] if n in x};f.update(type='property',begin=x.get('begin',0))
      if key=='naturalMagic':f['name']+=f' {int("".join(c for c in k if c.isdigit()))}'
      if x.get('stringTable')=='itemNames':f['domain']='loot'
      if x.get('stringTable')=='attackName':f['domain']='attacks'
      if x.get('stringTable')=='battleCommandName':f['domain']='commands'
      if x.get('stringTable')=='spellNames':f['domain']='stockSpells'
      if k in ['shopType','priceAdjust']:f['domain']=k
      fs[k]=f
     extra[key]=dict(name={'characters':'Character starting stats','shops':'Shops','rageMoves':'Rage attacks','danceMoves':'Dance attacks','controlMoves':'Control attacks','sketchMoves':'Sketch attacks','naturalMagic':'Natural magic','blitzLevels':'Blitz learning','swordLevels':'SwdTech learning'}[key],start=start,width=width,count=count,fields=fs)
     if mirror:extra[key]['mirror']=mirror
    table('characters','characterProperties',0x2d7ca0,22,64)
    table('shops','shopProperties',0x47ac0,9,128)
    table('rageMoves','monsterAttackRage',0xf4600,2,256)
    table('danceMoves','danceAttacks',0xffe80,4,8)
    table('controlMoves','monsterAttackControl',0x383a44,4,452,[0xf3d00,384])
    table('sketchMoves','monsterAttackSketch',0x384154,2,452,[0xf4300,384])
    table('naturalMagic','naturalMagic',0x2ce3c0,32,2)
    table('blitzLevels','blitzLevel',0x26f498,1,8)
    table('swordLevels','swdTechLevel',0x26f490,1,8)
    for name,sites in [('Character starting stats',[0xa104,0xa2a1]),('Shops',[0x3ba46,0x3bac9,0x3c08a]),('Rage attacks',[0x2060a]),('Dance attacks',[0x205c9]),('Control attacks',[0x2063e,0x23759]),('Sketch attacks',[0x23b5b]),('Natural magic',[0xa1b2,0x2620c]),('Blitz learning',[0xa213]),('SwdTech learning',[0xa1ec,0x26229])]:
     guard(name,[(i-1,4) for i in sites])
    f=out/'profile.js';text=f.read_text().split('// Additional Regular record editors.')[0]
    f.write_text(text+'// Additional Regular record editors. Derived from upstream ff3u-sfc.json.\nObject.assign(PROFILE.tables,'+json.dumps(extra,indent=2)+');\nLAYOUT_CHECKS.push(...'+json.dumps([{'name':k,'operands':v} for k,v in groups.items() if k not in ('Monster AI','Field tiles','World tiles')],indent=2)+');\n')


def build_map_objects():
    r=out
    def prop(name,at,mask=255,**kw):return dict(type='property',name=name,begin=at,mask=mask,**kw)
    xy=lambda:{'x':prop('Map X',0),'y':prop('Map Y',1)}
    def exitfields(m):
     dst=3 if m else 2
     f=xy()
     if m:f.update(span=prop('Length minus one',2,127),vertical=prop('Vertical',2,128,bool=True))
     f.update(dest=prop('Destination map',dst,511,domain='destMaps'),setParentMap=prop('Set parent map',dst+1,2,bool=True),
              elevation=prop('Upper level',dst+1,4,bool=True),title=prop('Show map title',dst+1,8,bool=True),
              facing=prop('Facing',dst+1,48,domain='directions'),destX=prop('Destination X',dst+2),destY=prop('Destination Y',dst+3))
     return f
    kinds=[
     ('mapNPCs','Map NPCs',0x3a0000,0x3a0000,9,{'x':prop('Map X',4,127),'y':prop('Map Y',5,63),'palette':prop('Sprite palette',2,28),'speed':prop('Movement speed',5,192,domain='npcSpeed'),'graphics':prop('Sprite graphics',6),'switchId':prop('Visibility switch',2,65472)},[0x52bc,0x52c2,0x52d4,0x52eb,0x5321,0x535a,0x5397]),
     ('mapTreasure','Treasure chests',0x326125,0x326485,5,{**xy(),'switchId':prop('Opened-chest flag',2,511),'reward':prop('Reward type',3,240,domain='chestType'),'value':prop('Reward byte',4)},[0x15dd,0x15e3,0x15f1,0x15fe,0x4bda,0x4be0,0x4bec,0x4c08]),
     ('mapEvents','Map event triggers',0x320000,0x320000,5,{**xy(),'event':prop('Field event offset',2,0xffffff,readOnly=True)},[0xbcbb,0xbcc1,0xbcca,0xbce0,0xbcfa,0x2e2178,0x2e217e]),
     ('shortExits','Single-tile exits',0x1fbb00,0x1fbb00,6,exitfields(False),[0x1a7d,0x1a83,0x1a8f,0x1ab6,0x1ae6,0x2e20eb,0x2e20f1]),
     ('longExits','Multi-tile exits',0x322000,0x322000,7,exitfields(True),[0x18ea,0x18f0,0x1903,0x1916,0x1963,0x197b])]
    e={};groups=[];geometry={}
    for key,name,t,b,w,fields,sites in kinds:
     ptr=struct.unpack_from('<432H',rom,t);start=b+ptr[0];count=(ptr[-1]-ptr[0])//w
     assert all((v-ptr[0])%w==0 for v in ptr) and all(x<=y for x,y in zip(ptr,ptr[1:]))
     e[key]=dict(name=name,start=start,width=w,count=count,fields=fields)
     geometry[key]=dict(pointer=t,base=b,first=ptr[0],last=ptr[-1])
     operands={}
     for i in sites:operands.setdefault(rom[i:i+4].hex(),[]).append(i)
     groups.append(dict(name=name,operands=operands))
    e['fieldPalettes']=dict(name='Field palettes',start=0x32c480,width=256,count=49,fields={'c'+str(i):prop('Color '+str(i),2*i,32767) for i in range(128)})
    groups.append(dict(name='Field palettes',operands={'bf80c4f2':[0x266c]}))
    p=r/'profile.js';s=p.read_text().split('// Fixed map-object')[0]
    s+='// Fixed map-object arrays in Regular and the pointer tables that group them by map.\n'
    s+='const MAP_OBJECT_INDEX='+json.dumps(geometry,indent=2)+';\nObject.assign(PROFILE.tables,'+json.dumps(e,indent=2)+');\nLAYOUT_CHECKS.push(...'+json.dumps(groups,indent=2)+');\n'
    p.write_text(s)


def build_dialogue():
    r=out
    d=definition['charTable']
    glyph={int(k,0):v for group in ['dialog','dte'] for k,v in d[group]['char'].items()}
    catalog={};caps={};seen={};valid=0
    profiles={}
    for key,label,table,count,base,end,first in [('dialogue','Field dialogue',0xce602,3084,0xd0000,0xeefbb,0),('addedDialogue','Added field dialogue I',0x300000,44,0x300000,0x30076a,0xf20),('denDialogue','Added field dialogue II',0x326a9d,132,0x320000,0x328000,0xf4c)]:
     starts=[base+(0x10000 if key=='dialogue' and i>=1574 else 0)+struct.unpack_from('<H',rom,table+2*i)[0] for i in range(count)]
     uniq=sorted(set(starts))
     for i,a in enumerate(uniq):
      limit=uniq[i+1] if i+1<len(uniq) else end;pos=a
      while pos<limit and rom[pos]:
       b=rom[pos];pos+=2 if b in (0x11,0x14,0x16) else 1
      caps[a]=pos-a+1 if pos<limit else 0
      seen[a]=starts.count(a)
     # A suffix can have its own pointer inside a string. Protect both references.
     for i,a in enumerate(uniq[:-1]):
      if caps[a]:continue
      pos=a
      while pos<end and rom[pos]:pos+=2 if rom[pos] in (0x11,0x14,0x16) else 1
      for other in uniq[i+1:]:
       if other>pos:break
       seen[other]+=seen[a]
     catalog[key]=[[a,caps[a],seen[a]] for a in starts]
     profiles[key]=dict(name=label,width=2,start=table,count=count,dialogue=True,idBase=first,fields={'pointer':dict(name='Bank offset',type='property',begin=0,mask=65535,readOnly=True)})
     print(key,count,'readable',sum(bool(caps[a]) for a in starts),'unique editable',sum(caps[a]>0 and seen[a]==1 for a in starts))
    p=r/'profile.js';s=p.read_text().split('// Field dialogue banks.')[0];s+='// Field dialogue banks.\nObject.assign(PROFILE.tables,'+json.dumps(profiles,indent=2)+');\n';p.write_text(s)
    p=r/'dialogue-layout.js';p.write_text('// Fixed Regular field dialogue slots. Offsets, capacities, reference counts and upstream encoding. GPL-3.0.\nconst TEXT_LAYOUT='+json.dumps(catalog,separators=(',',':'))+';\nconst FIELD_GLYPHS='+json.dumps(glyph,ensure_ascii=False,separators=(',',':'))+';\nconst TEXT_READER='+json.dumps(rom[0xd66f:0xd6df].hex())+';\n')


build_storage_and_tables()
build_map_objects()
build_dialogue()
