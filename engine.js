// FF6Tools SNES Advance edition. New integration, 2026-11-21. GPL-3.0.
"use strict";

const SIZE = 0x400000;
const {tables} = PROFILE;
const range = n => Array.from({length:n}, (_,i) => i);
const hex = (n, width=2) => "$" + n.toString(16).toUpperCase().padStart(width,"0");
const permitted = (key,i) => {
    if (!Number.isInteger(i) || i < 0 || i >= tables[key].count) return false;
    if (["monsters","loot","controlMoves","sketchMoves"].includes(key)) return i < 384 || i >= 416;
    return key !== "items" || i !== 255;
};
const spellIds = [...range(54),0x52,0x53,0x54];
function readName(bytes, start, length) {
    return Array.from(bytes.subarray(start,start+length), b => PROFILE.char[b] || "").join("").trim();
}
function mapObjectLocation(bytes,key,id) {
    const g=MAP_OBJECT_INDEX[key], t=tables[key], offset=t.start+id*t.width-g.base;
    let lo=0,hi=431;
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    while(lo+1<hi){
        const mid=(lo+hi)>>1;
        if(view.getUint16(g.pointer+2*mid,true)<=offset)lo=mid;else hi=mid;
    }
    return {map:lo,slot:(offset-view.getUint16(g.pointer+2*lo,true))/t.width};
}
function recordName(bytes, key, id) {
    if(tables[key].dialogue)return "Dialogue "+hex(visibleId(key,id),3);
    if(MAP_OBJECT_INDEX[key]) {
        const {map,slot}=mapObjectLocation(bytes,key,id);
        return recordName(bytes,"maps",map)+" "+hex(map,3)+" · #"+(slot+1);
    }
    switch (key) {
    case "controlMoves": case "sketchMoves": case "rageMoves": case "monsters": case "loot": return readName(bytes,0x384bec+10*id,10) || "Unnamed monster";
    case "items": return readName(bytes,(id<256 ? 0x12b300+13*id : 0x360080+13*(id-256))+1,12) || "Unnamed item";
    case "espers": case "summons": return readName(bytes,0x305c10+8*id,8);
    case "magic": return readName(bytes,0x3059bd+7*id+1,6);
    case "addedMagic": return readName(bytes,0x3059bd+7*(84-id)+1,6);
    case "addedSummons": return ["Leviathan · Tidal Wave","Gilgamesh · outcome 1","Gilgamesh · outcome 2","Gilgamesh · outcome 3","Gilgamesh · outcome 4","Cactuar","Diabolos"][id];
    case "maps": return ({229:"Soul Shrine entrance",230:"Soul Shrine interior",415:"Dragon’s Den entrance"})[id] || (id>=415 ? "Dragon’s Den" : PROFILE.mapNames[id] || "Map");
    case "fieldPalettes": return "Field palette "+hex(id);
    case "battleAnimations": return (typeof ANIMATION_NAMES!=="undefined" && ANIMATION_NAMES[id]) || "Animation "+hex(id,3);
    case "animationResources": return (typeof RESOURCE_NAMES!=="undefined" && RESOURCE_NAMES[id]) || "Animation resource "+hex(id,3);
    case "worldTerrain": return (id<256?"World of Balance":"World of Ruin")+" tile "+hex(id&255);
    case "characters": return readName(bytes,0x478c0+id*6,6) || "Character";
    case "shops": return "Shop "+String(id);
    case "danceMoves": return readName(bytes,0x26ff9d+id*12,12);
    case "naturalMagic": return ["Terra","Celes"][id];
    case "blitzLevels": return "Blitz "+(id+1);
    case "swordLevels": return readName(bytes,0xf3c40+id*12,12);
    default: return "Formation";
    }
}
function visibleId(key,id) { return key==="addedMagic" ? 84-id : id+(tables[key].idBase||0); }
function recordLabel(bytes,key,id) { return hex(visibleId(key,id),3)+"  "+recordName(bytes,key,id); }
function battleAttackName(bytes,id) {
    if(id<54)return recordName(bytes,"magic",id);
    if(id<81)return recordName(bytes,"espers",id-54);
    return readName(bytes,0x26f7b9+10*(id-81),10) || "Attack "+hex(id);
}
function domainTables(bytes) {
    function entries(ids, label) {return Object.fromEntries(ids.map(i=>[i,label(i)]));}
    return {
        roster:{...entries(range(452).filter(i=>permitted("monsters",i)),i=>recordName(bytes,"monsters",i)),511:"Empty slot"},
        loot:{...entries(range(255),i=>recordName(bytes,"items",i)),255:"Nothing"},
        teaching:{...entries(spellIds,i=>recordName(bytes,i<54?"magic":"addedMagic",i<54?i:84-i)),255:"No spell"},
        bonus:{...entries(range(17),i=>readName(bytes,0xffeae+i*9,9)),255:"No bonus"},
        stockSpells:entries(range(54),i=>recordName(bytes,"magic",i)),
        attacks:entries(range(256),i=>battleAttackName(bytes,i)),
        commands:{...entries(range(32),i=>readName(bytes,0x18cea0+7*i,7)),255:"Empty"},
        directions:["Up","Right","Down","Left"],
        destMaps:{...entries(range(431),i=>recordName(bytes,"maps",i)),511:"Parent map"},
        chestType:{0:"Empty",2:"Monster in a box",4:"Item",8:"GP"},
        npcSpeed:["Very slow","Slow","Normal","Fast"],
        shopType:["None","Weapon","Armor","Item","Relics","Vendor"],
        priceAdjust:["Normal","+50%","+100%","−50%","Female discount","Male discount","Edgar discount"],
        song:PROFILE.song
    };
}
// Names share the native action stack with stats. The icon is outside all name fields.
const names = {
    originalItemNames:{start:0x12b300,count:255,width:13,skip:1},
    extraItemNames:{start:0x360080,count:15,width:13,skip:1},
    enemyNames:{start:0x384bec,count:452,width:10,skip:0,mirror:[0xfc050,384]}
};
function nameKey(key,id) {
    if(key==="items")return id<256?["originalItemNames",id]:["extraItemNames",id-256];
    if(key==="monsters" || key==="loot")return ["enemyNames",id];
    return null;
}
function nativeNameArrays() {
    const arrays={};
    for(const [key,t] of Object.entries(names)){
        const fields={};
        for(let i=t.skip;i<t.width;i++)fields["c"+i]={type:"property",begin:i};
        const base=t.start+0xc00000;
        arrays[key]={type:"array",range:base+"-"+(base+t.width*t.count),
            array:{length:t.count,min:t.count,max:t.count},assembly:{type:"data",length:t.width,assembly:fields}};
    }
    return arrays;
}
// Native FF6Tools arrays and properties. The engine's existing split-MSB
// relationship handles both halves of a formation monster ID in one action.
function makeDefinition(domains) {
    const def = {type:"rom",name:"SNES Advance Regular",key:"snesAdvanceRegular",length:SIZE,
        system:"sfc",mode:"hiROM",noChecksumFix:true,freeSpace:[],assembly:{},hierarchy:[],
        stringTable:Object.fromEntries(Object.entries(domains).map(([k,v])=>[k,{string:v}]))};
    const list=[];
    for (const [key,t] of Object.entries(tables)) {
        const fields={};
        for (const [name,spec] of Object.entries(t.fields)) {
            const {domain,readOnly,...field}=spec;
            if (domain) field.stringTable=domain;
            if (readOnly) field.disabled=true;
            fields[name]=field;
        }
        const base=0xc00000+t.start;
        const row={type:"data",length:t.width,assembly:fields};
        if (key==="items") row.disabled="this.i === 255";
        if (["monsters","loot","controlMoves","sketchMoves"].includes(key)) row.disabled="this.i >= 384 && this.i < 416";
        def.assembly[key]={type:"array", name:t.name, range:base+"-"+(base+t.width*t.count),
            array:{length:t.count,min:t.count,max:t.count},assembly:row};
        list.push({name:t.name,path:key});
    }
    Object.assign(def.assembly,nativeNameArrays());
    def.hierarchy.push({name:"SNES Advance",list});
    return def;
}
function fixedTeaching(key,id,field){
    if(key!=="espers" || !/^(spell|rate)[1-5]$/.test(field))return false;
    return id===27 || ((id===29 || id===30) && field.endsWith("2"));
}
function fieldChoices(session,key,id,field){
    const domain=tables[key].fields[field].domain;
    if(domain==="destMaps" && session.project){const choices={...session.domains.destMaps};session.project.state.rooms.forEach((r,i)=>choices[431+i]=r.name);return choices;}
    if(domain==="teaching" && !fixedTeaching(key,id,field))
        return Object.fromEntries(Object.entries(session.domains.teaching).filter(([n])=>Number(n)<54 || Number(n)===255));
    return session.domains[domain];
}
function fieldMask(spec) {return spec.mask===undefined ? 255 : Number(spec.mask);}
const equipMenuWords=[0x3f503, 0x3f51d, 0x3f53e, 0x3f55f, 0x3f580, 0x3f5a1, 0x3f5c2, 0x3f5e3, 0x3f604, 0x3f625, 0x3f646, 0x3f667, 0x3f688, 0x3f6b0, 0x3f6d8];
function makeWriteMask() {
    const mask=new Uint8Array(SIZE);
    for (const [key,t] of Object.entries(tables)) {
        for(let id=0;id<t.count;id++) {
            if(!permitted(key,id)) continue;
            const starts=[t.start];
            if(t.mirror && id<t.mirror[1]) starts.push(t.mirror[0]);
            for(const start of starts) {
                for(const field of Object.values(t.fields)) {
                    if(field.readOnly) continue;
                    let bits=fieldMask(field);
                    let at=start+id*t.width+field.begin;
                    while(bits) {mask[at++]|=bits&255; bits>>>=8;}
                }
            }
        }
    }
    for(const [key,t] of Object.entries(names)) {
        for(let i=0;i<t.count;i++) {
            if(key==="enemyNames" && (!permitted("monsters",i) || i===382 || i===383))continue;
            const bases=[t.start];
            if(t.mirror && i<t.mirror[1])bases.push(t.mirror[0]);
            for(const base of bases) mask.fill(255,base+i*t.width+t.skip,base+(i+1)*t.width);
        }
    }
    for(const at of equipMenuWords){mask[at]=255;mask[at+1]=63;}
    mask.fill(255,0xffdc,0xffe0);
    return mask;
}
const writeMask=makeWriteMask();
async function hashBytes(bytes){
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,"0")).join("");
}
async function checkLayout(bytes) {
    if(bytes[0xffd5]!==0x31 || bytes[0xffd7]!==0x0c)
        throw Error("ROM header conflict. This edition expects the 4 MiB Fast HiROM Regular layout.");
    const gearCode=bytes.slice(0x3f4f6,0x3f6f3);
    for(let i=0;i<equipMenuWords.length;i++){
        const at=equipMenuWords[i], row=tables.items.start+(256+i)*30+1;
        if(bytes[at]!==bytes[row] || bytes[at+1]!==bytes[row+1])
            throw Error("Added equipment mask conflict for item "+hex(256+i,3)+" at SNES "+hex(at+0xc00000,6)+" and "+hex(row+0xc00000,6)+".");
        gearCode.fill(0,at-0x3f4f6,at-0x3f4f6+2);
    }
    if(await hashBytes(gearCode)!=="bead45bd71cc16f80ba6b449f20aee772425b31428766c5078e0e62d6f79eac3")
        throw Error("The added equipment menu reader has changed at SNES $C3F4F6.");
    for(const group of LAYOUT_CHECKS) {
        let site;
        for(const [encoded, locations] of Object.entries(group.operands || {})) {
            const expected=encoded.match(/../g).map(x=>parseInt(x,16));
            site=locations.find(at=>expected.some((v,k)=>bytes[at+k]!==v));
            if(site!==undefined)break;
        }
        if(group.sha) {
            const actual=await hashBytes(bytes.subarray(group.at,group.at+group.size));
            if(actual!==group.sha)site=group.at;
        }
        if(site!==undefined)throw Error(group.name+" layout conflict at SNES "+hex(0xc00000+site,6)+". The Regular table reader has changed.");
    }
}
function syncMirror(output, original, t) {
    if(!t.mirror) return;
    const [mirror,count]=t.mirror;
    for(let i=0;i<count*t.width;i++) {
        const delta=original[t.start+i]^output[t.start+i];
        if(delta) output[mirror+i]=original[mirror+i]^delta;
    }
}
function updateChecksum(bytes) {
    bytes.set([255,255,0,0],0xffdc);
    let sum=0;
    for(const b of bytes) sum+=b;
    sum &= 65535;
    const view=new DataView(bytes.buffer,bytes.byteOffset);
    view.setUint16(0xffdc,sum^65535,true);
    view.setUint16(0xffde,sum,true);
}
class AdvanceRom {
    static async open(file) {
        const hasHeader=file.length===SIZE+512;
        if(!hasHeader && file.length!==SIZE) throw Error("Open a 4 MiB SNES Advance v1.6 Regular ROM. A 512-byte copier header is supported.");
        const raw=file.slice(hasHeader?512:0);
        const saved=typeof restoreProject==="function"?restoreProject(raw):null;
        const bytes=saved?.clean??raw;
        await checkLayout(bytes);
        // All shipped mirrored fields start equal and this editor changes them together.
        for(const t of [...Object.values(tables),{...names.enemyNames,name:"Monster names"}]) {
            if(!t.mirror) continue;
            const [mirror,n]=t.mirror;
            for(let i=0;i<n*t.width;i++) if(bytes[mirror+i]!==bytes[t.start+i])
                throw Error(t.name+" mirror conflict in row "+hex(Math.floor(i/t.width),3)+" at SNES "+hex(0xc00000+t.start+i,6)+" and "+hex(0xc00000+mirror+i,6)+". The two copies disagree.");
        }
        for(const [key,g] of Object.entries(MAP_OBJECT_INDEX)){
            const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), width=tables[key].width;
            let last=g.first;
            for(let map=0;map<=431;map++){
                const ptr=view.getUint16(g.pointer+map*2,true);
                if(ptr<last || ptr>g.last || (ptr-g.first)%width || (!map && ptr!==g.first) || (map===431 && ptr!==g.last))
                    throw Error(tables[key].name+" pointer table exceeds its fixed record allocation.");
                last=ptr;
            }
        }
        const session=new AdvanceRom(bytes,file.slice(0,hasHeader?512:0));
        if(saved)session.project=new MapProject(session,saved.state);
        return session;
    }
    constructor(bytes,header) {
        this.original=bytes; this.header=header;
        this.domains=domainTables(bytes);
        this.model=ROMObject.create(null,makeDefinition(this.domains));
        this.model.disassemble(bytes);
        // An edit after an undo drops the redo branch. Keep reverted fields dirty
        // even when their actions no longer appear on either stack at export.
        this.model.doAction=function(action,undo){
            ROM.prototype.doAction.call(this,action,undo);
            for(const entry of (Array.isArray(action)?action:[action]))entry.object?.markAsDirty();
        };
    }
    row(key,id) {
        if(!tables[key] || !permitted(key,id)) throw Error("Reserved or unavailable record.");
        return this.model[key].item(id);
    }
    nameInfo(key,id) {
        const pair=nameKey(key,id);
        if(!pair || !permitted(key,id))return null;
        const [family,index]=pair,t=names[family],row=this.model[family].item(index);
        const cells=range(t.width-t.skip).map(i=>row["c"+(i+t.skip)].value);
        const text=cells.map(b=>PROFILE.char[b]??"�").join("").trimEnd();
        const editable=cells.every(b=>Object.hasOwn(PROFILE.char,b)) && !(family==="enemyNames" && (id===382 || id===383));
        return {t,row,cells,text,editable};
    }
    name(key,id) {
        const info=this.nameInfo(key,id);
        return info?.text || recordName(this.original,key,id);
    }
    rename(key,id,text) {
        const info=this.nameInfo(key,id);
        if(!info?.editable)throw Error("This record uses a special name format.");
        text=text.replaceAll("'", "’").replaceAll('"',"”");
        const chars=Array.from(text);
        if(!text.trim() || chars.length>info.cells.length || text.trim()!==text)
            throw Error("Enter 1–"+info.cells.length+" characters with no leading or trailing spaces.");
        const codes=new Map(Object.entries(PROFILE.char).map(([n,c])=>[c,Number(n)]));
        codes.set(" ",254);
        const encoded=chars.map((c,i)=>{
            if(!codes.has(c))throw Error("The game font cannot display "+c+".");
            return PROFILE.char[info.cells[i]]===c?info.cells[i]:codes.get(c);
        });
        if(info.cells.every((b,i)=>b===(encoded[i]??255)))return;
        this.model.beginAction();
        try{
            for(let i=0;i<info.cells.length;i++) info.row["c"+(info.t.skip+i)].setValue(encoded[i]??255);
        }finally{this.model.endAction();}
    }
    itemFieldLabel(id, key) {
        const type=this.original[tables.items.start+id*tables.items.width]&7;
        if(key.startsWith("equip") && (type<1 || type>5)) return null;
        if(key==="power") return type<2?"Attack power":type<6?"Defense":type===6?"Item power":null;
        if(key==="accuracy") return type<2?"Hit rate":type<6?"Magic defense":null;
        return tables.items.fields[key].name;
    }
    set(key,id,field,value) {
        const spec=tables[key]?.fields[field];
        if(!spec || spec.hidden || spec.readOnly || fixedTeaching(key,id,field)) throw Error("This field is read-only.");
        const row=this.row(key,id), prop=row[field];
        if(key==="items" && !this.itemFieldLabel(id,field)) throw Error("This field is unused for this item type.");
        if(spec.bool) value=Number(value);
        if(!Number.isInteger(value)) throw Error("Enter a whole number.");
        if(key==="battleAnimations" && ["sprite","layer1","layer3","extra"].includes(field) && value!==65535 && (value&32767)>=674)
            throw Error("Choose an animation resource from 0–673, optionally add 32768 for no graphics, or use 65535 for none.");
        if(key==="animationResources"){
            if(["frameCount","frameWidth","frameHeight"].includes(field) && value<1)throw Error("Use at least one tile or frame.");
            const first=field==="frameOffset"?value:row.frameOffset.value;
            const count=field==="frameCount"?value:row.frameCount.value;
            if(first+count>3025)throw Error("The frame sequence exceeds the Regular frame directory.");
        }
        if(spec.domain && !Object.hasOwn(fieldChoices(this,key,id,field),value)) throw Error("This ID is unavailable in this field.");
        const max=spec.bool?1:(spec.max===undefined?prop.max:Number(spec.max));
        if(value<0 || value>max || value%(spec.multiplier || 1)) throw Error("Value is outside the field’s range.");
        if(key==="formations" && field.endsWith("Present") && value && row[field.replace("Present","")].value===511)
            throw Error("Choose a monster before activating this slot.");
        if(Number(prop.value)===value && !(key==="formations" && spec.domain==="roster" && value===511 && row[field+"Present"].value))return;
        this.model.beginAction();
        try {
            prop.setValue(spec.bool ? Boolean(value) : value);
            if(key==="formations" && spec.domain==="roster" && value===511)
                row[field+"Present"].setValue(false);
        } finally {this.model.endAction();}
    }
    baseOutput() {
        if(!this.model.assemble()) throw Error("The FF6Tools model could not assemble this edit.");
        const bytes=this.model.data.slice();
        for(const t of [...Object.values(tables),names.enemyNames]) syncMirror(bytes,this.original,t);
        for(let i=0;i<equipMenuWords.length;i++){
            const property=tables.items.start+(256+i)*30+1;
            bytes.set(bytes.subarray(property,property+2),equipMenuWords[i]);
        }
        let changed=false;
        for(let i=0;i<SIZE;i++) {
            const delta=bytes[i]^this.original[i];
            if(delta & ~writeMask[i]) throw Error("An edit reached outside a supported field. Export stopped.");
            if(delta) changed=true;
        }
        if(this.assets?.write(bytes)) changed=true;
        if(this.dialogue?.write(bytes)) changed=true;
        if(this.graphics?.write(bytes))changed=true;
        if(changed) updateChecksum(bytes);
        return bytes;
    }
    export() {
        const bytes=this.baseOutput();
        if(this.project && hasProject(this.project.state)){renderProject(bytes,this.project.state);updateChecksum(bytes);}
        const result=new Uint8Array(SIZE+this.header.length);
        result.set(this.header);result.set(bytes,this.header.length);
        return result;
    }
}
