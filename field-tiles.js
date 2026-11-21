// Static SNES tile rendering. Layout, graphics and palette are taken from the open ROM.
// Tile ordering and decoding follow FF6Tools' ff6-map.js and ff6-map-layer.js. GPL-3.0.
"use strict";
function mapLayerInfo(rom,id,layer) {
    const at=tables.maps.start+33*id;
    const get=(offset,shift,mask)=>(readLE(rom,at+offset,2)>>>shift)&mask;
    const gfx=[get(7,0,127),get(7,7,127),get(8,6,127),get(9,5,127)];
    return {
        layout:get(13+layer,layer*2,1023),gfx, gfx3:get(10,4,63),
        tileset:layer===0?get(11,2,127):get(12,1,127),
        width:16<<get(layer===2?24:23,layer===1?2:6,3),
        height:16<<get(layer===2?24:23,layer===1?0:4,3),
        palette:rom[at+25],anim:rom[at+27]&31,anim3:rom[at+27]>>>5
    };
}
function fieldAtlas(rom, map, layer, paletteRow=null,layer3Override=null,priorities=null) {
    const info=mapLayerInfo(rom,map,layer);
    function entry(id,table,base,count,end,packed) {
        if(id>=count)throw Error("Graphics index exceeds its Regular table.");
        const start=base+readLE(rom,table+3*id,3);
        const stop=packed?start+readLE(rom,start,2):
            id+1<count ? base+readLE(rom,table+3*(id+1),3) : end;
        const moved=table===0x1fba00 && typeof assetKinds!=="undefined" && assetKinds.metatiles &&
            start>=assetKinds.metatiles.pool[0] && stop<=assetKinds.metatiles.pool[1];
        if(start<base || stop<=start || (stop>end && !moved))throw Error("Graphics pointer outside its table.");
        return rom.slice(start,stop);
    }
    const decode=(b,f)=>ROMAssembly.decode(b,f)[0];
    const pixels=new Uint8Array(0x10000);
    let tiles;
    if(layer<2) {
        for(let i=0;i<4;i++) {
            if(i===3 && info.gfx[2]===info.gfx[3])continue;
            const data=entry(info.gfx[i],0x1fda00,0x1fdb00,82,0x25f400,false);
            pixels.set(decode(data,"snes4bpp"),[0,0x4000,0x6000,0x8000][i]);
        }
        if(info.anim>=20)throw Error("Unknown field animation bank.");
        const a=readLE(rom,0x91d5+2*info.anim,2),b=readLE(rom,0x91d5+2*(info.anim+1),2);
        for(let i=0;a+10*i<b;i++){
            const frame=readLE(rom,0x91ff+a+10*i+2,2);
            pixels.set(decode(rom.slice(0x260000+frame,0x260000+frame+128),"snes4bpp"),0xa000+256*i);
        }
        tiles=decode(entry(info.tileset,0x1fba00,0x1e0000,75,0x1fb400,true),
            ["snes4bppTile","interlace(4,16,2)","interlace(1,2,4)","interlace(1,8,256)","ff6-lzss"]);
        if(tiles.length!==1024)throw Error("Unexpected field tileset size.");
    } else {
        const packet=layer3Override??entry(info.gfx3,0x26cd60,0x268780,18,0x26cd60,true);
        const data=decode(packet,"ff6-lzss");
        tiles=data.subarray(0,64);
        pixels.set(decode(data.slice(64),"snes2bpp"));
        if(info.anim3>0 && info.anim3<=6) {
            const id=info.anim3-1, p=0x97ad+readLE(rom,0x979f+2*id,2);
            const art=decode(entry(id,0x26cda0,0x26cdc0,6,0x26f198,true),["snes2bpp","ff6-lzss"]);
            const begin=readLE(rom,p+4,2)*4,length=readLE(rom,p+2,2)*4;
            pixels.set(art.subarray(begin,begin+length));
        }
    }
    if(info.palette>48)throw Error("Unknown field palette.");
    const pal=rom.slice(0x32c480+info.palette*256,0x32c480+(info.palette+1)*256);
    if(paletteRow)for(let i=0;i<128;i++){const n=paletteRow["c"+i].value;pal[2*i]=n&255;pal[2*i+1]=n>>8;}
    const rgba=new Uint8ClampedArray(256*256*4);
    for(let id=0;id<256;id++)for(let y=0;y<16;y++)for(let x=0;x<16;x++) {
        let tile,palette,sx=x&7,sy=y&7;
        const at=(id>>>4)*16*256+y*256+(id&15)*16+x;
        if(layer<2) {
            const desc=tiles[(id>>4)*64+(id&15)*2+(y>>3)*32+(x>>3)];
            if(priorities)priorities[at]=(desc>>>24)&1;
            tile=desc&1023;palette=((desc>>>20)&7)*16;
            if(desc&0x10000000)sx=7-sx;if(desc&0x20000000)sy=7-sy;
        } else {
            if(priorities)priorities[at]=rom[tables.maps.start+33*map+2]>>>7;
            const ix=id&64?15-x:x, iy=id&128?15-y:y;
            sx=ix&7;sy=iy&7;tile=(id&63)*4+(iy>>3)*2+(ix>>3);
            palette=tiles[id&63]&28;
        }
        const color=pixels[64*tile+8*sy+sx];
        if(!color)continue;
        const rgb=readLE(pal,2*(palette+color),2),p=4*((id>>>4)*16*256+y*256+(id&15)*16+x);
        for(let ch=0;ch<3;ch++){const n=(rgb>>>(5*ch))&31;rgba[p+ch]=(n<<3)|(n>>>2);}
        rgba[p+3]=255;
    }
    return rgba;
}
function unpackLayout(bytes) {
    const unpacked=ROM.dataFormat["ff6-lzss"].decode(bytes);
    if(unpacked[1]!==bytes.length || !unpacked[0].length)throw Error("Field layout decoding failed.");
    return unpacked[0];
}
function saveLayer(assets,id,next,kind="layouts") {
    const old=unpackLayout(assets.packed(kind,id));
    if(next.length!==old.length)throw Error("Layer dimensions changed.");
    if(sameBytes(old,next))return;
    // Painting back to the original tiles should restore the original compression too.
    const row=assets.store(kind).rows[id];
    const initial=assets.source.subarray(row.at,row.at+row.size);
    const encoded=sameBytes(unpackLayout(initial),next)?initial:ROM.dataFormat["ff6-lzss"].encode(next)[0];
    if(!sameBytes(unpackLayout(encoded),next))throw Error("Compressed layer failed round-trip verification.");
    assets.set(kind,id,encoded);
}

function trenchColors(rom){
    const start=0x180000+readLE(rom,0x2e8e20,2);
    const length=readLE(rom,start,2);
    if(start!==0x18e6ba && (start<0x18ee48 || start+length>0x18f000))throw Error("Unsupported Serpent Trench palette pointer.");
    if(length<2 || (start===0x18e6ba && length>247))throw Error("Invalid Serpent Trench palette length.");
    return unpackLayout(rom.slice(start,start+length));
}
function worldAtlas(rom,map) {
    const artAt=readLE(rom,[0x2eb212,0x2eb21e,0x2eb22a][map],3)-0xc00000;
    const end=artAt+readLE(rom,artAt,2);
    const art=unpackLayout(rom.slice(artAt,end));
    if(art.length<0x2480)throw Error("World graphics are incomplete.");
    const decode=(b,format)=>ROMAssembly.decode(b,format)[0];
    const tiles=decode(art.slice(0,0x400),["generic4bppTile","interlace(2,16,2)"]);
    const pixels=decode(art.slice(0x400,0x2400),"linear4bpp");
    const indices=decode(art.slice(0x2400,0x2480),"linear4bpp");
    const pal=map===2?trenchColors(rom):rom.subarray(0x12ec00+map*256,0x12ed00+map*256);
    const rgba=new Uint8ClampedArray(256*256*4);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
        const tile=tiles[(y>>3)*32+(x>>3)],color=pixels[64*tile+8*(y&7)+(x&7)];
        const rgb=readLE(pal,2*(color?indices[tile]*16+color:0),2);
        const p=4*(y*256+x);
        for(let ch=0;ch<3;ch++){const n=(rgb>>>(5*ch))&31;rgba[p+ch]=(n<<3)|(n>>>2);}
        rgba[p+3]=255;
    }
    return rgba;
}
