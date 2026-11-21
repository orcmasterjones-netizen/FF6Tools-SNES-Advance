// ROM-backed artwork and battle animation frames. GPL-3.0.
"use strict";
class GraphicsEdits{
    constructor(session){this.session=session;this.ranges=new Map();}
    bytes(at,n){
        const bytes=this.session.original.slice(at,at+n);
        for(const [start,data] of this.ranges){
            const lo=Math.max(at,start),hi=Math.min(at+n,start+data.length);
            if(lo<hi)bytes.set(data.subarray(lo-start,hi-start),lo-at);
        }
        return bytes;
    }
    replace(at,data,label){
        const old=this.ranges.get(at),base=this.session.original.subarray(at,at+data.length);
        if(sameBytes(old??base,data))return;
        const after=sameBytes(base,data)?null:data.slice();
        // Multiple views can share a physical tile block. Distinct overlapping ranges
        // are rejected so one pending edit can never silently erase another.
        for(const [start,other] of this.ranges)if((start!==at || other.length!==data.length) && start<at+data.length && at<start+other.length)
            throw Error("An overlapping graphic already has pending edits. Export and reopen before editing through this view.");
        const apply=v=>{if(v)this.ranges.set(at,v);else this.ranges.delete(at);};
        this.session.model.doAction(new ROMAction(null,()=>apply(old),()=>apply(after),label));
    }
    write(out){for(const [at,data] of this.ranges)out.set(data,at);return this.ranges.size>0;}
}
function graphicEdits(s){return s.graphics ||= new GraphicsEdits(s);}
function spriteStart(rom,id){
    return readLE(rom,0xd0ff+id*2,2)+(rom[0xd249+id*2]-192)*65536;
}
function layer3Packet(s,id){
    const hexData=mapProject(s).state.bg3?.[id];
    if(hexData)return fromHex(hexData);
    const r=s.original,at=0x268780+readLE(r,0x26cd60+3*id,2),size=readLE(r,at,2);
    if(at+size>0x26cd60 || size<2)throw Error("Invalid layer 3 graphics pointer.");
    return r.slice(at,at+size);
}
function graphicSheet(s,kind,id,palette=0,sub=0,rom=s.baseOutput()){
    let at,size,w,h,bpp=4,positions=[],pal,raw,paletteData;
    if(kind==="monster"){
        integer(id,0,451,"Monster");if(!permitted("monsters",id))throw Error("Reserved monster.");
        const art=artwork(rom,id);
        if(!art?.tiles)throw Error("This monster uses separate or empty artwork.");
        const rec=0x386f3c+5*id,side=art.size/8,pitch=side/8;
        bpp=u16(rom,rec)&32768?3:4;at=art.pixels;size=art.tiles*bpp*8;
        const slot=MONSTER_ART_SLOTS[id];
        if(!slot || at!==slot[0] || size>slot[1])throw Error("The monster sprite exceeds its verified graphics allocation.");
        const mask=0x120000+u16(rom,side===16?0x12a822:0x12a820)+rom[rec+4]*side*pitch;
        for(let y=0;y<side;y++)for(let x=0;x<side;x++)if(rom[mask+y*pitch+(x>>3)]&(128>>(x&7)))positions.push([x,y]);
        w=h=art.size;pal=art.pal;
    }else if(kind==="world"){
        integer(id,0,2,"World map");integer(sub,0,7,"Subpalette");
        const decoded=unpackLayout(sessionAssets(s).packed("worldArt",id));
        if(decoded.length<0x2480)throw Error("Invalid world tileset.");
        const indices=ROMAssembly.decode(decoded.slice(0x400,0x2400),"linear4bpp")[0];
        raw=ROMAssembly.encode(indices,"snes4bpp")[0];size=raw.length;w=h=128;
        for(let n=0;n<256;n++)positions.push([n%16,n>>4]);
        paletteData=id===2?trenchColors(rom):rom.slice(0x12ec00+id*256,0x12ed00+id*256);
        pal=32*sub;
    }else if(kind==="layer3"){
        integer(id,0,17,"Layer 3 graphics ID");
        const decoded=unpackLayout(layer3Packet(s,id));
        if(decoded.length<80 || (decoded.length-64)%16)throw Error("Invalid planar layer 3 sheet.");
        raw=decoded.slice(64);size=raw.length;bpp=2;
        pal=0x32c480+256*integer(palette,0,48,"Palette")+8*integer(sub,0,7,"Subpalette");
        const cols=Math.min(16,size/16);w=cols*8;h=8*Math.ceil(size/16/cols);
        for(let n=0;n<size/16;n++)positions.push([n%cols,Math.floor(n/cols)]);
    }else{
        const npc=kind==="sprite";
        if(!npc && kind!=="tiles")throw Error("Unknown sheet type.");
        integer(id,0,npc?164:81,"Graphics ID");
        if(npc){
            if(readLE(rom,0x548e,3)!==0xc0d0ff || readLE(rom,0x5497,3)!==0xc0d249)throw Error("Field sprite pointer reader changed.");
            at=spriteStart(rom,id);
            const all=Array.from({length:165},(_,i)=>spriteStart(rom,i));
            const end=Math.min(0x183000,...all.filter(a=>a>at));
            if(at<0x150000 || at>=end)throw Error("Unsupported field sprite address.");
            size=end-at;pal=0x268000+integer(palette,0,31,"Palette")*32;
        }else{
            if(readLE(rom,0x26f7,3)!==0xdfda00)throw Error("Field graphics reader changed.");
            const ptr=i=>0x1fdb00+readLE(rom,0x1fda00+3*i,3);
            at=ptr(id);const end=id===81?0x25f400:ptr(id+1);
            if(at<0x1fdb00 || end<=at || end>0x25f400)throw Error("Invalid field graphics slot.");
            size=end-at;pal=0x32c480+256*integer(palette,0,48,"Palette")+32*integer(sub,0,7,"Subpalette");
        }
        if(size%32)throw Error("This sheet has a nonstandard tile boundary.");
        const cols=Math.min(16,size/32);w=8*cols;h=8*Math.ceil(size/32/cols);
        for(let n=0;n<size/32;n++)positions.push([n%cols,Math.floor(n/cols)]);
    }
    const colors=Array.from({length:1<<bpp},(_,i)=>{
        const c=u16(paletteData??rom,pal+2*i);
        return [0,5,10].map(shift=>{const v=(c>>shift)&31;return v<<3|v>>2;});
    });
    const indices=new Uint8Array(w*h),data=raw??rom.slice(at,at+size);
    positions.forEach(([x,y],n)=>{
        for(let j=0;j<8;j++)for(let i=0;i<8;i++){
            let ink=0;for(let plane=0;plane<bpp;plane++){
                const k=n*bpp*8+(plane<2?2*j+plane:bpp===3?16+j:16+2*j+plane-2);
                ink|=((data[k]>>(7-i))&1)<<plane;
            }indices[(8*y+j)*w+8*x+i]=ink;
        }
    });
    return {at,size,bpp,w,h,colors,indices,positions,paletteOffset:kind==="world" && id<2?0x12ec00+id*256+pal:pal};
}
function sheetRGBA(sheet,indexed=false){
    const out=new Uint8ClampedArray(sheet.w*sheet.h*4);
    sheet.indices.forEach((v,i)=>{
        const c=Math.round(v*255/(sheet.colors.length-1));
        out.set(indexed?[c,c,c]:sheet.colors[v],i*4);out[i*4+3]=v?255:0;
    });return out;
}
function importSheet(s,kind,id,palette,sub,pixels,width,height,indexed=false){
    const sheet=graphicSheet(s,kind,id,palette,sub);
    if(width!==sheet.w || height!==sheet.h)throw Error("Use a "+sheet.w+" × "+sheet.h+" PNG.");
    const source={pixels,width,height};
    const plan=planGraphicImport(sheet,source,{sx:0,sy:0,dx:0,dy:0,w:width,h:height},indexed?"index":"exact");
    applyGraphicImport(s,kind,id,palette,sub,plan);
}
function writeSheetPixels(s,kind,id,sheet,indices){
    if(sameBytes(indices,sheet.indices))return;
    const bytes=new Uint8Array(sheet.size);
    sheet.positions.forEach(([x,y],n)=>{
        for(let j=0;j<8;j++)for(let i=0;i<8;i++){
            const ink=indices[(8*y+j)*sheet.w+8*x+i];
            for(let plane=0;plane<sheet.bpp;plane++)if(ink&(1<<plane)){
                const k=n*sheet.bpp*8+(plane<2?2*j+plane:sheet.bpp===3?16+j:16+2*j+plane-2);
                bytes[k]|=128>>i;
            }
        }
    });
    if(kind==="world"){
        const assets=sessionAssets(s),decoded=unpackLayout(assets.packed("worldArt",id));
        const ink=ROMAssembly.decode(bytes,"snes4bpp")[0],linear=ROMAssembly.encode(ink,"linear4bpp")[0];
        if(sameBytes(decoded.subarray(0x400,0x2400),linear))return;
        decoded.set(linear,0x400);saveLayer(assets,id,decoded,"worldArt");
    }else if(kind==="layer3"){
        const decoded=unpackLayout(layer3Packet(s,id));
        if(sameBytes(decoded.subarray(64),bytes))return;
        decoded.set(bytes,64);
        const packed=ROM.dataFormat["ff6-lzss"].encode(decoded)[0];
        if(!sameBytes(unpackLayout(packed),decoded))throw Error("Layer 3 compression failed.");
        mapProject(s).change("Import layer 3 graphics",q=>{(q.bg3??={})[id]=byteString(packed);});
    }else graphicEdits(s).replace(sheet.at,bytes,"Import graphics");
}
function animationFrame(s,id){
    integer(id,0,3024,"Animation frame");
    const rom=s.original,extra=id>=2948,table=extra?0x30b2f4:0x14dfcc,bank=extra?0x330000:0x110000;
    if(readLE(rom,0x19f66,3)!==0xf0cbcf || readLE(rom,0x30cbd5,3)!==0xd4dfcc)throw Error("Animation frame reader changed.");
    const a=bank+readLE(rom,table+2*id,2),end=bank+readLE(rom,table+2*id+2,2);
    const limit=extra?0x33eed2:0x11e989;
    if(a<(extra?0x33e008:0x110141)||a>limit)throw Error("Unsupported frame bank.");
    let p=a;
    while(p!==end && p+1<limit && !(rom[p]===255 && rom[p+1]===255))p+=2;
    if(p!==end && (p+1>=limit || readLE(rom,p,2)!==65535))throw Error("Unterminated animation frame.");
    return {at:a,data:graphicEdits(s).bytes(a,p-a)};
}
function saveFrame(s,id,text){
    const frame=animationFrame(s,id);
    const slots=sourceLines(text);
    if(slots.length*2!==frame.data.length)throw Error("Keep the existing number of tile slots in this frame.");
    const out=[];
    for(const {words,line} of slots){
        if(words.length!==5)throw Error("Line "+line+" needs X Y tile horizontal-flip vertical-flip.");
        const [x,y,t,h,v]=words.map((w,i)=>numberToken(w,[15,15,63,1,1][i]));
        const pos=x*16+y,cell=t+h*64+v*128;
        if(pos===255 && cell===255)throw Error("That combination is the frame terminator.");
        out.push(pos,cell);
    }graphicEdits(s).replace(frame.at,Uint8Array.from(out),"Edit animation frame");
}
