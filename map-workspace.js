// Combined field map model and static compositor. GPL-3.0.
"use strict";
const mapKinds={mapNPCs:"NPC",mapTreasure:"Chest",mapEvents:"Tile trigger",shortExits:"Exit",longExits:"Long exit"};
const mapColors={mapNPCs:"#c5f9b2",mapTreasure:"#ffca70",mapEvents:"#ff8585",shortExits:"#84baff",longExits:"#b9a3ff"};
function mapObjects(s,map,rom){
    const rows=[],state=mapProject(s).state;
    for(const kind of Object.keys(mapKinds)){
        const t=tables[kind],g=MAP_OBJECT_INDEX[kind];
        if(map<431){
            const start=g.base+readLE(rom,g.pointer+2*map,2),end=g.base+readLE(rom,g.pointer+2*map+2,2);
            for(let at=start,i=0;at<end;at+=t.width,i++){
                const key=[kind,map,i].join("/");
                rows.push({key,kind,map,id:(at-t.start)/t.width,scene:state.bindings?.[key],raw:rom.slice(at,at+t.width)});
            }
        }
        state.objects.forEach((o,index)=>{
            if(o.kind===kind && o.map===map)rows.push({key:"added/"+index,kind,map,index,scene:o.scene,raw:fromHex(o.data)});
        });
    }
    return rows;
}
function objectField(o,key){
    const f=tables[o.kind].fields[key],mask=fieldMask(f),shift=31-Math.clz32(mask&-mask);
    return (readLE(o.raw,f.begin,Math.ceil((32-Math.clz32(mask))/8))&mask)>>>shift;
}
function objectBounds(o){
    const x=objectField(o,"x"),y=objectField(o,"y");
    const delta=o.kind==="longExits"?objectField(o,"span"):0,vertical=delta && objectField(o,"vertical");
    return {x,y,w:1+(vertical?0:delta),h:1+(vertical?delta:0)};
}
function mapHit(objects,x,y){
    return objects.filter(o=>{const r=objectBounds(o);return x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h;});
}
function specialNPC(o){return o.kind==="mapNPCs" && Boolean(o.raw[4]&128) && !(o.raw[7]&192);}
function objectEvent(o){
    if(o.kind==="mapNPCs" && !specialNPC(o))return readLE(o.raw,0,3)&0x3ffff;
    if(o.kind==="mapEvents")return readLE(o.raw,2,3);
    return null;
}
function applyObjectFields(s,o,values){
    const t=tables[o.kind],raw=o.raw.slice(),edits=[];
    for(const [key,v] of Object.entries(values)){
        const f=t.fields[key];
        if(!f || f.readOnly)throw Error("Choose an editable object property.");
        const mask=fieldMask(f),shift=31-Math.clz32(mask&-mask),n=Math.ceil((32-Math.clz32(mask))/8);
        const value=integer(v,0,f.max??(mask>>>shift),f.name);
        if(f.domain && !Object.hasOwn(fieldChoices(s,o.kind,o.id,key),value))throw Error("Choose an available "+f.name+".");
        if(objectField(o,key)===value)continue;
        const word=readLE(raw,f.begin,n);
        writeLE(raw,f.begin,(word&~mask)|(value<<shift),n);edits.push([key,value]);
    }
    if(!edits.length)return;
    if(o.index!==undefined){mapProject(s).object(o.map,o.kind,raw,o.scene,o.index);return;}
    s.model.beginAction();
    try{for(const [key,value] of edits)s.set(o.kind,o.id,key,value);}
    finally{s.model.endAction();}
}
function placeMapObject(s,map,kind,x,y){
    const state=mapProject(s).state;
    const values={x,y,event:EMPTY_SCENE,destination:map,destX:x,destY:y,length:2,facing:2,speed:2,type:4};
    if(kind==="mapTreasure"){
        values.switch=freeChestFlag(s);
        if(values.switch==="")throw Error("All 512 chest flags are in use.");
    }
    mapProject(s).object(map,kind,objectBytes(kind,values));
    return "added/"+state.objects.length;
}
function targetScene(s,map,key,o){
    const state=mapProject(s).state,entrance=key==="entrance";
    const offset=entrance?(map<431?readLE(s.original,0x11fa00+map*3,3):EMPTY_SCENE):objectEvent(o);
    const scene=entrance?state.startup[map]:o.scene;
    return {offset,scene,source:scene!=null?state.scenes[scene].source:existingSceneSource(s.original,offset)};
}
function bindMapScene(s,map,key,o,index,source,name){
    const project=mapProject(s);
    project.change("Bind map event",q=>{
        if(source!==null){
            const current=key==="entrance"?q.startup[map]:o.scene;
            const uses=[...Object.values(q.startup),...Object.values(q.bindings??{}),...q.objects.map(obj=>obj.scene)];
            index=current!=null && uses.filter(ref=>ref===current).length===1?current:q.scenes.length;
            q.scenes[index]={name:current===index?q.scenes[index].name:name,source};
        }
        if(index!=null)integer(index,0,q.scenes.length-1,"Scene");
        if(key==="entrance"){if(index==null)delete q.startup[map];else q.startup[map]=index;}
        else if(o.index!==undefined)q.objects[o.index].scene=index;
        else {q.bindings??={};if(index==null)delete q.bindings[key];else q.bindings[key]=index;}
    });
}
function mapDialogue(line){
    const words=line.trim().split(/\s+/);
    let id;
    try{
        if(words[0]==="dialogue" && words.length===2)id=numberToken(words[1],65535)&0x3fff;
        else if(["dialog_48","dialog_4b"].includes(words[0]) && words.length===3)id=(numberToken(words[1],255)|(numberToken(words[2],255)<<8))&0x3fff;
        else return null;
    }catch{return null;}
    for(const key of Object.keys(TEXT_LAYOUT)){
        const index=id-(tables[key].idBase||0);
        if(index>=0 && index<TEXT_LAYOUT[key].length)return {id,key,index};
    }
    return {id};
}
function loadMapArt(s,map,rom){
    const world=map<3,assets=sessionAssets(s),rec=tables.maps.start+33*map,layers=[];
    for(let l=0;l<(world?1:3);l++){
        const side=map===2?128:256;
        const info=world?{width:side,height:side,layout:map}:mapLayerInfo(rom,map,l);
        if(!world && !info.layout)continue;
        const packet=map>=431?fromHex(mapProject(s).state.rooms[map-431].layers[l]):assets.packed(world?"worlds":"layouts",info.layout);
        const priority=new Uint8Array(65536),bytes=unpackLayout(packet);
        const atlas=world?worldAtlas(rom,map):fieldAtlas(rom,map,l,null,l===2?layer3Packet(s,info.gfx3):null,priority);
        const signed=n=>(n<<24)>>24;
        layers.push({...info,l,atlas,priority,bytes,dx:l?signed(rom[rec+16+l*2]):0,dy:l?signed(rom[rec+17+l*2]):0});
    }
    const math=0xfe00+3*rom[rec+32],palette=0x32c480+256*rom[rec+25];
    return {map,layers,w:Math.max(1,...layers.map(l=>l.width)),h:Math.max(1,...layers.map(l=>l.height)),
        main:world?1:rom[math+1]|1,sub:world?0:rom[math+2],math:world?0:rom[math],back:world?[0,0,0]:colorRGB(readLE(rom,palette,2))};
}
function mapLayerCell(layer,x,y){
    const mod=(n,m)=>(n%m+m)%m;
    const i=mod(y+layer.dy,layer.height)*layer.width+mod(x+layer.dx,layer.width);
    return i<layer.bytes.length?i:-1;
}
// Cache the resulting 16x16 tiles in the viewport, keyed by visible layer IDs.
function composeMapTile(art,ids){
    const output=new Uint8ClampedArray(1024);
    const visible=art.layers.map((layer,i)=>{
        const tile=ids[i];
        return {layer,base:tile<0?-1:(tile>>4)*4096+(tile&15)*16,mask:1<<layer.l};
    }).filter(v=>v.base>=0);
    for(let y=0;y<16;y++)for(let x=0;x<16;x++){
        let mz=-1,sz=-1,main=null,sub=null,mi=0,si=0,math=false;
        for(const {layer,base,mask} of visible){
            const at=base+256*y+x,i=at*4;if(!layer.atlas[i+3])continue;
            const high=layer.priority[at],z=layer.l===2?(high?17:3):(high?15:11)-layer.l;
            if((art.main&mask) && z>mz){main=layer.atlas;mi=i;mz=z;math=Boolean(art.math&mask);}
            if((art.sub&mask) && z>sz){sub=layer.atlas;si=i;sz=z;}
        }
        const p=4*(16*y+x);
        for(let c=0;c<3;c++){
            let val=main?main[mi+c]:art.back[c];
            if(math && sub){
                let n=(val>>3)+(art.math&128?-(sub[si+c]>>3):(sub[si+c]>>3));
                if(art.math&64)n>>=1;n=Math.min(31,Math.max(0,n));val=(n<<3)|(n>>2);
            }
            output[p+c]=val;
        }
        output[p+3]=255;
    }
    return output;
}
function mapNPCPixels(rom,o){
    if(specialNPC(o) || (o.raw[7]&192) || o.raw[6]>=165)return null;
    const anim=o.raw[8]>>>5;
    const frame=anim===1?0:anim===2?50:anim===3?40:[4,71,1,7][o.raw[8]&3];
    const base=spriteStart(rom,o.raw[6]),pal=0x268000+32*objectField(o,"palette");
    // The field DMA routine's long indexed load points to the six tile offsets per pose.
    const layouts=readLE(rom,0x67f0,3)-0xc00000;
    if(rom[0x67ef]!==0xbf || layouts<0 || layouts+58*12>rom.length)return null;
    const pose=layouts+(frame&63)*12;
    const out=new Uint8ClampedArray(16*24*4);
    for(let t=0;t<6;t++){
        const at=base+readLE(rom,pose+t*2,2);
        if(at<0x150000 || at+32>0x183000)return null;
        const pixels=ROMAssembly.decode(rom.slice(at,at+32),"snes4bpp")[0];
        for(let i=0;i<64;i++){
            const ink=pixels[i];if(!ink)continue;
            let x=(t&1)*8+(i&7);if(frame&64)x=15-x;
            const y=(t>>1)*8+(i>>3),p=4*(16*y+x);
            out.set(colorRGB(readLE(rom,pal+ink*2,2)),p);out[p+3]=255;
        }
    }
    return out;
}
