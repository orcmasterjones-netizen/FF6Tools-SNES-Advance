// SNES Advance formation preview. GPL-3.0, 2026-11-21.
"use strict";
function u16(bytes,at){return bytes[at]|(bytes[at+1]<<8);}
function artwork(bytes,id) {
    if(id===262)return null; // Phantom Train uses background graphics.
    const rec=0x386f3c+5*id, packed=u16(bytes,rec), bpp=packed&0x8000?3:4;
    const offset=(packed&32767)*8;
    let pixels=0x297000+offset;
    // Regular redirects six groups of graphics offsets to the added art.
    if(offset>=0x3f800 && offset<0x3fe00){
        const dispatch=0x301768,block=(0x3fd00-(offset&0x3ff00))>>8;
        const at=dispatch+13+block*17;
        pixels=bytes[at]|(bytes[at+4]<<8)|((bytes[at+8]&63)<<16);
    }
    const pal=0x387b98+(((bytes[rec+2]&3)<<8)|bytes[rec+3])*16;
    const side=bytes[rec+2]&0x80?16:8, pitch=side/8;
    const mask=0x120000+u16(bytes,side===16?0x12a822:0x12a820)+bytes[rec+4]*side*pitch;
    const palette=range(1<<bpp).map(i=>{
        const rgb=u16(bytes,pal+2*i);
        return [0,5,10].map(shift=>{const c=(rgb>>shift)&31;return (c<<3)|(c>>2);});
    });
    const size=side*8, rgba=new Uint8ClampedArray(size*size*4);
    let width=0,height=0,tiles=0;
    for(let y=0;y<side;y++)for(let x=0;x<side;x++){
        if(!(bytes[mask+y*pitch+(x>>3)]&(128>>(x&7))))continue;
        width=Math.max(width,(x+1)*8);height=Math.max(height,(y+1)*8);
        const at=pixels+tiles++*bpp*8;
        for(let j=0;j<8;j++)for(let k=0;k<8;k++){
            const bit=7-k;
            let index=(bytes[at+j*2]>>bit&1)|((bytes[at+j*2+1]>>bit&1)<<1);
            if(bpp===3)index|=(bytes[at+16+j]>>bit&1)<<2;
            else index|=((bytes[at+16+j*2]>>bit&1)<<2)|((bytes[at+17+j*2]>>bit&1)<<3);
            if(!index)continue;
            const dest=((y*8+j)*size+x*8+k)*4;
            const color=palette[index];
            rgba[dest]=color[0];rgba[dest+1]=color[1];rgba[dest+2]=color[2];rgba[dest+3]=255;
        }
    }
    return {rgba,size,width,height,tiles,pixels,pal};
}
function previewSlots(session,id) {
    const row=session.row("formations",id), bytes=session.graphics?session.baseOutput():session.original;
    const layout=bytes[tables.formations.start+15*id]>>4;
    const directory=0x2d03b;
    const start=layout<13?0x20000+u16(bytes,directory+layout*2):0;
    const end=layout<12?0x20000+u16(bytes,directory+layout*2+2):0x2d115;
    const list=[];
    for(let i=0;i<6;i++){
        const key="monster"+(i+1),monster=row[key].value;
        if(!row[key+"Present"].value)continue;
        const sprite=permitted("monsters",monster)?artwork(bytes,monster):null;
        const slot=start+4*i, allocated=start && slot+4<=end;
        const w=allocated?8*bytes[slot+2]:0,h=allocated?8*bytes[slot+3]:0;
        list.push({slot:i+1,monster,sprite,x:row[key+"X"].value,y:row[key+"Y"].value,
            warning:!allocated?"No VRAM allocation":!sprite?"Special graphics":sprite.width>w||sprite.height>h?"Exceeds slot graphics space":""});
    }
    return list;
}
function drawFormation(session,id){
    const section=element("section"),canvas=element("canvas");canvas.width=256;canvas.height=160;
    canvas.className="battle-preview";canvas.setAttribute?.("aria-label","Formation slot placement, normal battle orientation");
    section.append(canvas);
    const list=previewSlots(session,id);
    const context=canvas.getContext?.("2d");
    if(context){
        context.fillStyle="#18212c";context.fillRect(0,0,256,160);
        context.fillStyle="#253340";for(let y=0;y<160;y+=16)for(let x=0;x<256;x+=16)context.fillRect(x,y,1,1);
        for(const entry of list){
            const a=entry.sprite;
            if(!a || !a.tiles)continue;
            const layer=element("canvas");layer.width=a.size;layer.height=a.size;
            layer.getContext("2d").putImageData(new ImageData(a.rgba,a.size,a.size),0,0);
            context.drawImage(layer,entry.x,entry.y);
        }
    }
    const legend=element("p",list.length?list.map(e=>"Slot "+e.slot+" · "+(permitted("monsters",e.monster)?session.name("monsters",e.monster):hex(e.monster))+(e.warning?" ("+e.warning+")":"")).join("   /   "):"No active slots.");
    legend.className="note";section.append(legend);return section;
}
