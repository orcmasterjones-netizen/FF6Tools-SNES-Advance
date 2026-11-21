// Regular authoring profiles. GPL-3.0.
"use strict";
// Attack animation configuration.
PROFILE.tables.battleAnimations={
  "name": "Battle animations",
  "width": 14,
  "count": 406,
  "start": 1081266,
  "fields": {
    "sprite": {
      "name": "Sprite animation word",
      "type": "property",
      "begin": 0,
      "mask": 65535
    },
    "layer1": {
      "name": "Layer1 animation word",
      "type": "property",
      "begin": 2,
      "mask": 65535
    },
    "layer3": {
      "name": "Layer3 animation word",
      "type": "property",
      "begin": 4,
      "mask": 65535
    },
    "extra": {
      "name": "Extra animation word",
      "type": "property",
      "begin": 11,
      "mask": 65535
    },
    "soundEffect": {
      "name": "Sound effect",
      "type": "property",
      "begin": 9,
      "mask": 255
    },
    "delay": {
      "name": "Thread delay",
      "type": "property",
      "begin": 13,
      "mask": 255
    },
    "specialFunction": {
      "name": "Initialization function",
      "type": "property",
      "begin": 10,
      "mask": 127
    },
    "target": {
      "name": "Layer 1 target flag",
      "type": "property",
      "begin": 10,
      "mask": 128
    },
    "spritePal": {
      "name": "Sprite palette",
      "type": "property",
      "begin": 6,
      "mask": 255
    },
    "layer1Pal": {
      "name": "Layer 1 palette",
      "type": "property",
      "begin": 7,
      "mask": 255
    },
    "layer3Pal": {
      "name": "Layer 3 palette",
      "type": "property",
      "begin": 8,
      "mask": 255
    }
  }
};
LAYOUT_CHECKS.push({name:"Battle animations",operands:{"bfb27fd0":[105629]}});

// The Regular world movement routines read this pair of 256-word sets directly.
PROFILE.tables.worldTerrain={name:"World tile properties",start:0x2e9b16,count:512,width:2,fields:{}};
for(const [name,label,mask] of [
    ["noChocobo","Impassable on chocobo",1],["noLanding","Airship cannot land",2],["shadow","Airship shadow size",12],
    ["noFoot","Impassable on foot",16],["forest","Forest",32],["battles","Random encounters",64],
    ["background","Battle background",0x700],["veldt","Veldt",0x2000],["phoenix","Phoenix Cave",0x4000],["tower","Kefka’s Tower",0x8000]
])PROFILE.tables.worldTerrain.fields[name]={name:label,type:"property",begin:0,mask,bool:(mask&(mask-1))===0};
LAYOUT_CHECKS.push({name:"World tile properties",operands:{"bf169bee":[0x2e19d3,0x2e1cea,0x2e1d34,0x2e2205]}});
// Six-byte animation graphics records end at Regular's relocated frame pointer table.
PROFILE.tables.animationResources={name:"Animation resources",start:0x14d000,count:674,width:6,fields:{
    frameCount:{name:"Frame count",type:"property",begin:0,mask:63},
    frameOffset:{name:"First frame",type:"property",begin:2,mask:65535,max:3024},
    frameWidth:{name:"Frame width in tiles",type:"property",begin:4,mask:255,max:16},
    frameHeight:{name:"Frame height in tiles",type:"property",begin:5,mask:255,max:16},
    twoBpp:{name:"2 bpp graphics",type:"property",begin:0,mask:128,bool:true}
}};
LAYOUT_CHECKS.push({name:"Animation resources",operands:{"bf00d0d4":[0x1a14e]}});

// Ordinary field NPC pose and movement bits (map editor and record inspector).
Object.assign(PROFILE.tables.mapNPCs.fields,{facing:{type:"property",name:"Facing",begin:8,mask:3,domain:"directions"},movement:{type:"property",name:"Movement pattern",begin:7,mask:15}});
