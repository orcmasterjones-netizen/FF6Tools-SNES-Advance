// Additional map directories and event programs for 4 MiB Regular. GPL-3.0.
"use strict";
const PROJECT_ARENA=0x3b2000, PROJECT_META=0x3e0000, PROJECT_END=0x3f8000;
const BG3_DIR=0x3a5400,BG3_DATA=0x3a5500,BG3_END=0x3b0000;
const ROOM_PROPS=0x3d0000, ROOM_LAYOUTS=0x3d4200, START_EVENTS=0x3ce400;
const PROJECT_MAGIC=[83,65,69,68,48,53,13,10];
const EMPTY_SCENE=0x5eb3;
const OBJECT_DIRS={
    mapNPCs:       [0x3c0000,0x3c6600,[0x52bc,0x52c2,0x52d4,0x52db,0x52e2,0x52eb,0x52f8,0x5305,0x5321,0x532c,0x533a,0x535a,0x5369,0x5373,0x537f,0x538a,0x5397,0x53ad,0x53bc,0x53d0,0x53e3]],
    mapEvents:     [0x3c6600,0x3c9000,[0xbcbb,0xbcc1,0xbcca,0xbce0,0xbcfa,0x2e2178,0x2e217e,0x2e218d,0x2e2195,0x2e219d,0x2e21a6,0x2e21ae]],
    shortExits:    [0x3c9000,0x3cba00,[0x1a7d,0x1a83,0x1a8f,0x1aaa,0x1ab6,0x1ac2,0x1ad1,0x1ae6,0x1af0,0x1afd,0x1b0b,0x1b2c,0x1b5e,0x2e20eb,0x2e20f1,0x2e2100,0x2e2108,0x2e2112,0x2e213e]],
    longExits:     [0x3cba00,0x3cce00,[0x18ea,0x18f0,0x1903,0x190b,0x1916,0x191e,0x192f,0x193a,0x1942,0x1963,0x196f,0x197b,0x198a,0x199f,0x19a9,0x19b6,0x19c4,0x19e5,0x1a14]],
    mapTreasure:   [0x3cce00,0x3ce400,[0x15dd,0x15e3,0x4bda,0x4be0,0x15f1,0x15f7,0x15fe,0x1609,0x4bec,0x4bf4,0x4c08,0x4c0e]]
};
function writeLE(data,at,value,n){
    for(let i=0;i<n;i++)data[at+i]=(value>>>(8*i))&255;
}
function byteString(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");}
function fromHex(text){
    if(typeof text!=="string" || !/^(?:[\da-fA-F]{2})*$/.test(text))throw Error("Invalid encoded bytes.");
    return Uint8Array.from(text.match(/../g)||[],h=>parseInt(h,16));
}
function integer(value,lo,hi,what){
    if(!Number.isInteger(value)||value<lo||value>hi)throw Error(what+" must be between "+lo+" and "+hi+".");
    return value;
}
function roomCount(s){return 431+s.rooms.length;}
function freshProject(){return {rooms:[],objects:[],scenes:[],startup:{},battle:{},collision:{},bindings:{},bg3:{}};}
function hasProject(s){return Object.values(s).some(v=>Object.keys(v).length);}
function projectJSON(s){return JSON.stringify(s).replace(/[\u007f-\uffff]/g,c=>"\\u"+c.charCodeAt(0).toString(16).padStart(4,"0"));}
function projectHooks(state){
    const hooks=[];
    function pointer(sites,old,next,width){
        for(const at of sites){
            const delta=PROJECT_OPERANDS[at]-old;
            if(delta<0 || delta>=width)throw Error("Unrecognized table reader "+hex(at,6));
            hooks.push([at+1,old+delta,next+delta,3]);
        }
    }
    for(const [key,[base,,sites]] of Object.entries(OBJECT_DIRS)){
        const index=MAP_OBJECT_INDEX[key];
        const split=key==="mapTreasure"?4:sites.length;
        pointer(sites.slice(0,split),0xc00000+index.pointer,0xc00000+base,10);
        if(split!==sites.length)pointer(sites.slice(split),0xc00000+index.base,0xc00000+base+1024,5);
    }
    pointer([0x1cbf],0xf22996,0xc00000+ROOM_PROPS,1);
    pointer([0x2892,0x289f,0x28e6,0x28f3,0x293c,0x2949],0xf0076a,0xc00000+ROOM_LAYOUTS,3);
    pointer([0xbffe,0xc007,0xc010],0xd1fa00,0xc00000+START_EVENTS,3);
    pointer([0x1cd5],0xd9cd10,0xfd9000,1);
    hooks.push([0x1cda,0xa800,0x9100,2],[0x1ce2,0xd9,0xfd,1]);
    pointer([0x1fd62],0xd09800,0xfdc000,1);
    hooks.push([0x1fd6c,0xd0,0xfd,1]);
    if(Object.keys(state.bg3??{}).length){
        hooks.push([0x2777,0xe6cd60,0xc00000+BG3_DIR,3],[0x277b,0x8780,BG3_DATA&65535,2],[0x2783,0xe6,0xfa,1]);
    }
    return hooks;
}
function checkedPut(dst,at,bytes,end,what){
    if(at+bytes.length>end)throw Error(what+" exceeds its reserved storage.");
    dst.set(bytes,at);return at+bytes.length;
}
function setLayerId(rec,l,id){
    let off=13+l,shift=2*l;
    const word=readLE(rec,off,2);
    writeLE(rec,off,(word&~(1023<<shift))|(id<<shift),2);
}
function battleList(rom,id){
    let at=0x100000+readLE(rom,0x109800+2*id,2),start=at;
    while(at<0x10d000){
        const op=rom[at++];
        if(op===255)return rom.slice(start,at);
        const spec=BATTLE_OPS[op];
        if(!spec)throw Error("Unknown battle event command "+hex(op)+" in event "+id+".");
        at+=spec[1];
    }
    throw Error("Unterminated battle event "+id+".");
}
function renderProject(out,s){
    if(!hasProject(s))return;
    integer(s.rooms.length,0,79,"Added map count");
    if(!out.subarray(PROJECT_ARENA,PROJECT_END).every(b=>b===255))throw Error("The map-authoring expansion is occupied by another modification.");
    const hooks=projectHooks(s);
    for(const [at,old,,n] of hooks)if(readLE(out,at,n)!==old)throw Error("Conflicting game reader at "+hex(0xc00000+at,6)+".");
    for(const [at,,next,n] of hooks)writeLE(out,at,next,n);
    if(Object.keys(s.bg3??{}).length){
        if(!out.subarray(BG3_DIR,BG3_END).every(b=>b===255))throw Error("The layer 3 graphics expansion is occupied.");
        let dataAt=BG3_DATA;
        for(let id=0;id<18;id++){
            const src=0x268780+readLE(out,0x26cd60+3*id,2);
            const bytes=s.bg3[id]?fromHex(s.bg3[id]):out.slice(src,src+readLE(out,src,2));
            writeLE(out,BG3_DIR+3*id,dataAt-BG3_DATA,2);
            dataAt=checkedPut(out,dataAt,bytes,BG3_END,"Layer 3 graphics");
        }
    }
    const stockMap=tables.maps.start;
    out.copyWithin(ROOM_PROPS,stockMap,stockMap+431*33);
    out.copyWithin(ROOM_LAYOUTS,0x30076a,0x30076a+389*3);
    out.copyWithin(START_EVENTS,0x11fa00,0x120000);
    let tileAt=PROJECT_ARENA;
    for(const [i,room] of s.rooms.entries()){
        const rec=fromHex(room.record);
        if(rec.length!==33 || room.layers.length!==3)throw Error("Invalid room data.");
        for(let l=0;l<3;l++){
            if(!room.layers[l]){setLayerId(rec,l,0);continue;}
            const index=389+i*3+l,bytes=fromHex(room.layers[l]);
            if(bytes.length!==readLE(bytes,0,2))throw Error("Invalid room layer packet.");
            writeLE(out,ROOM_LAYOUTS+index*3,tileAt-0x19d1b0,3);
            tileAt=checkedPut(out,tileAt,bytes,0x3c0000,"Room tiles");
            setLayerId(rec,l,index);
        }
        out.set(rec,ROOM_PROPS+(431+i)*33);
        writeLE(out,START_EVENTS+(431+i)*3,EMPTY_SCENE,3);
    }
    let eventAt=0x3d5000;
    const sceneOffsets=[];
    for(const scene of s.scenes){
        sceneOffsets.push(eventAt-0xa0000);
        eventAt=checkedPut(out,eventAt,assembleField(scene.source,eventAt),0x3d9000,"Field events");
    }
    for(const [map,scene] of Object.entries(s.startup)){
        integer(Number(map),3,roomCount(s)-1,"Map");
        integer(scene,0,sceneOffsets.length-1,"Scene");
        writeLE(out,START_EVENTS+Number(map)*3,sceneOffsets[scene],3);
    }
    const thunks=new Map();
    function linkScene(record,key,scene){
        if(scene!=null){
            integer(scene,0,sceneOffsets.length-1,"Scene");
            const off=sceneOffsets[scene];
            if(key==="mapEvents")writeLE(record,2,off,3);
            else if(key==="mapNPCs"){
                if(!thunks.has(scene)){
                    if(thunks.size===3)throw Error("The three NPC talk-event bridges are in use. Reuse a scene or use a tile trigger.");
                    const at=0xce5ee+thunks.size*5;
                    if(!out.subarray(at,at+5).every(b=>b===255))throw Error("The NPC talk-event bridge is occupied.");
                    out[at]=0xb2;writeLE(out,at+1,off,3);out[at+4]=0xfe;thunks.set(scene,at-0xa0000);
                }
                writeLE(record,0,(readLE(record,0,3)&0xfc0000)|thunks.get(scene),3);
            }else throw Error("Only a trigger or NPC can run a scene.");
        }
    }
    for(const [key,[base,limit]] of Object.entries(OBJECT_DIRS)){
        const g=MAP_OBJECT_INDEX[key],w=tables[key].width;
        let tail=base+1024;
        const origin=key==="mapTreasure"?tail:base;
        for(let m=0;m<=511;m++){
            writeLE(out,base+2*m,tail-origin,2);
            if(m>=roomCount(s))continue;
            const additions=s.objects.filter(o=>o.map===m && o.kind===key);
            let count=additions.length;
            if(m<431){
                const start=g.base+readLE(out,g.pointer+2*m,2),end=g.base+readLE(out,g.pointer+2*m+2,2);
                count+=(end-start)/w;
                const dest=tail;
                tail=checkedPut(out,tail,out.subarray(start,end),limit,tables[key].name);
                for(let j=0;j<(end-start)/w;j++){
                    const scene=s.bindings?.[[key,m,j].join("/")];
                    if(scene!=null)linkScene(out.subarray(dest+j*w,dest+(j+1)*w),key,scene);
                }
            }
            if(key==="mapNPCs" && count>32)throw Error("A map can hold at most 32 NPCs.");
            for(const obj of additions){
                const record=fromHex(obj.data);
                if(record.length!==w)throw Error("Invalid map object length.");
                linkScene(record,key,obj.scene);
                tail=checkedPut(out,tail,record,limit,tables[key].name);
            }
        }
    }
    let prop=0x3d9100;
    for(let id=0;id<42;id++){
        const a=0x19a800+readLE(out,0x19cd10+2*id,2);
        const packed=s.collision[id]?fromHex(s.collision[id]):out.slice(a,a+readLE(out,a,2));
        writeLE(out,0x3d9000+id*2,prop-0x3d9100,2);
        prop=checkedPut(out,prop,packed,0x3dc000,"Tile properties");
    }
    let battle=0x3dc200;
    for(let id=0;id<33;id++){
        const bytes=Object.hasOwn(s.battle,id)?assembleBattle(s.battle[id]):battleList(out,id);
        writeLE(out,0x3dc000+2*id,battle&65535,2);
        battle=checkedPut(out,battle,bytes,0x3e0000,"Battle events");
    }
    const text=projectJSON(s),data=Uint8Array.from(text,c=>c.charCodeAt(0));
    checkedPut(out,PROJECT_META+16,data,PROJECT_END,"Project metadata");
    out.set(PROJECT_MAGIC,PROJECT_META);writeLE(out,PROJECT_META+8,data.length,4);
    writeLE(out,PROJECT_META+12,ROM.crc32(data),4);
}
function restoreProject(input){
    if(!sameBytes(input.subarray(PROJECT_META,PROJECT_META+8),PROJECT_MAGIC))return null;
    const size=readLE(input,PROJECT_META+8,4);
    if(size>PROJECT_END-PROJECT_META-16)throw Error("Invalid editor project size.");
    const payload=input.subarray(PROJECT_META+16,PROJECT_META+16+size);
    if(ROM.crc32(payload)!==readLE(input,PROJECT_META+12,4))throw Error("The embedded authoring project checksum differs.");
    const state=JSON.parse(Array.from(payload,c=>String.fromCharCode(c)).join(""));
    const clean=input.slice();clean.fill(255,PROJECT_ARENA,PROJECT_END);
    for(const [at,old,next,n] of projectHooks(state)){
        if(readLE(input,at,n)!==next)throw Error("A project table reader changed outside the editor.");
        writeLE(clean,at,old,n);
    }
    const npcScenes=state.objects.filter(o=>o.kind==="mapNPCs" && o.scene!=null).map(o=>o.scene);
    for(const [key,id] of Object.entries(state.bindings??{}))if(key.startsWith("mapNPCs/"))npcScenes.push(id);
    const bridges=new Set(npcScenes).size;
    if(bridges>3)throw Error("Invalid NPC event bridge table.");
    clean.fill(255,0xce5ee,0xce5ee+bridges*5);
    if(Object.keys(state.bg3??{}).length)clean.fill(255,BG3_DIR,BG3_END);
    const rebuilt=clean.slice();renderProject(rebuilt,state);
    if(!sameBytes(rebuilt,input))throw Error("The live project tables disagree with the embedded edits.");
    updateChecksum(clean);
    return {clean,state};
}
class MapProject{
    constructor(session,state=freshProject()){this.session=session;this.state=state;}
    change(label,edit){
        const before=this.state,after=JSON.parse(JSON.stringify(before));edit(after);
        if(projectJSON(before)===projectJSON(after))return;
        renderProject(this.session.baseOutput(),after);
        this.session.model.doAction(new ROMAction(null,()=>{this.state=before;},()=>{this.state=after;},label));
    }
    addRoom(template,name){
        integer(template,3,430,"Source field map");
        if(!name.trim())throw Error("Enter a room name.");
        const raw=this.session.baseOutput(),record=raw.slice(tables.maps.start+template*33,tables.maps.start+(template+1)*33);
        record[5]&=127;
        const layers=[0,1,2].map(l=>{
            const id=mapLayerInfo(raw,template,l).layout;
            if(!id)return null;
            return byteString(sessionAssets(this.session).packed("layouts",id));
        });
        if(!layers.some(Boolean))throw Error("Choose a source map with tile data.");
        this.change("Create room",s=>s.rooms.push({name:name.trim(),template,record:byteString(record),layers}));
        return roomCount(this.state)-1;
    }
    setLayer(map,l,data){
        const room=this.state.rooms[map-431];
        if(!room?.layers[l])throw Error("Choose an existing room layer.");
        const current=unpackLayout(fromHex(room.layers[l]));
        if(current.length!==data.length)throw Error("Keep the stored layer dimensions.");
        if(sameBytes(current,data))return;
        const packed=ROM.dataFormat["ff6-lzss"].encode(data)[0];
        if(!sameBytes(unpackLayout(packed),data))throw Error("Room compression failed.");
        this.change("Paint new room",s=>{s.rooms[map-431].layers[l]=byteString(packed);});
    }
    object(map,kind,data,scene=null,index=null){
        integer(map,0,roomCount(this.state)-1,"Map");
        if(map<3 && !["mapEvents","shortExits"].includes(kind))throw Error("World maps support tile events and single-tile exits.");
        if(!Object.hasOwn(OBJECT_DIRS,kind)||data.length!==tables[kind].width)throw Error("Invalid map object.");
        this.change("Edit map object",s=>{
            const row={map,kind,data:byteString(data),scene};
            if(index===null)s.objects.push(row);else s.objects[integer(index,0,s.objects.length-1,"Object")]=row;
        });
    }
    scene(name,source,id=null){
        if(!name.trim())throw Error("Enter a scene name.");
        this.change("Edit field event",s=>{
            const entry={name:name.trim(),source};
            if(id===null)s.scenes.push(entry);else s.scenes[integer(id,0,s.scenes.length-1,"Scene")]=entry;
        });return id??this.state.scenes.length-1;
    }
}
function mapProject(s){return s.project ||= new MapProject(s);}
