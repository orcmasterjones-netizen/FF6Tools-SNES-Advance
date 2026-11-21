// PNG region mapping and native SNES palette generation. GPL-3.0.
"use strict";
assetKinds.trenchPalette={table:0x2e8e20,stride:2,base:0x180000,pool:[0x18ee48,0x18f000],guard:"Trench palette"};
WORK_LAYOUT.trenchPalette=[[0x18e6ba,247]];
WORK_LAYOUT.guards["Trench palette"]={"a2":[0x2e8e1f],"86d2a9d885d4":[0x2e8e22]};

function colorWord(rgb){
    const component=i=>Math.round(rgb[i]*31/255);
    return component(0)|(component(1)<<5)|(component(2)<<10);
}
function colorRGB(word){
    return [0,5,10].map(shift=>{const v=(word>>shift)&31;return (v<<3)|(v>>2);});
}
function component(word,axis){return (word>>(axis*5))&31;}
function colorDistance(a,b){
    const dr=component(a,0)-component(b,0),dg=component(a,1)-component(b,1),db=component(a,2)-component(b,2);
    return 2*dr*dr+4*dg*dg+db*db;
}
// Weighted median cut in the SNES color space. Working in five bits avoids
// spending separate palette entries on colors the console displays identically.
function reducedColors(hist,capacity){
    const points=[...hist.keys()].sort((a,b)=>a-b);
    if(points.length<=capacity)return points;
    if(!capacity)return [];
    function box(values){
        let bestAxis=0,score=-1;
        for(let axis=0;axis<3;axis++){
            let lo=31,hi=0;
            for(const v of values){const c=component(v,axis);lo=Math.min(lo,c);hi=Math.max(hi,c);}
            const spread=(hi-lo)**2*[2,4,1][axis];
            if(spread>score){bestAxis=axis;score=spread;}
        }
        const mass=values.reduce((n,v)=>n+hist.get(v),0);
        return {values,axis:bestAxis,weight:mass,priority:mass*score};
    }
    const boxes=[box(points)];
    while(boxes.length<capacity){
        const part=boxes.reduce((a,b)=>a.priority>=b.priority?a:b);
        if(!part.priority)break;
        const sorted=part.values.sort((a,b)=>component(a,part.axis)-component(b,part.axis)||a-b);
        let split=0,total=0;
        while(split<sorted.length-1 && total*2<part.weight)total+=hist.get(sorted[split++]);
        boxes.splice(boxes.indexOf(part),1,box(sorted.slice(0,split)),box(sorted.slice(split)));
    }
    return boxes.map(b=>{
        let result=0;
        for(let axis=0;axis<3;axis++){
            const sum=b.values.reduce((n,v)=>n+hist.get(v)*component(v,axis),0);
            result|=Math.round(sum/b.weight)<<(axis*5);
        }
        return result;
    });
}
function generateColors(old,locked,hist){
    const result=old.slice(),free=[];
    const held=new Set();
    for(let i=1;i<old.length;i++){
        if(locked.has(i))held.add(old[i]);else free.push(i);
    }
    if([...hist.keys()].every(c=>old.includes(c,1)))return result;
    const needed=new Map([...hist].filter(([c])=>!held.has(c)));
    const desired=[...new Set(reducedColors(needed,free.length))];
    // Retain original ink indices wherever a representative already exists.
    const claimed=new Set(),missing=[];
    for(const c of desired){
        const found=free.find(i=>!claimed.has(i) && old[i]===c);
        if(found===undefined)missing.push(c);else claimed.add(found);
    }
    const available=free.filter(i=>!claimed.has(i));
    missing.forEach((c,i)=>{result[available[i]]=c;});
    return result;
}
function planGraphicImport(sheet,source,rect,mode){
    const {width,height,pixels}=source,{sx,sy,dx,dy,w,h}=rect;
    if(!["index","exact","nearest","generate"].includes(mode))throw Error("Choose a color mode.");
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||pixels.length!==width*height*4)throw Error("Invalid PNG pixel dimensions.");
    integer(w,1,Math.min(width,sheet.w),"Selection width");integer(h,1,Math.min(height,sheet.h),"Selection height");
    integer(sx,0,width-w,"Source X");integer(sy,0,height-h,"Source Y");
    integer(dx,0,sheet.w-w,"Destination X");integer(dy,0,sheet.h-h,"Destination Y");
    const mask=new Uint8Array(sheet.w*sheet.h);
    for(const [x,y] of sheet.positions)for(let j=0;j<8;j++){
        const start=(y*8+j)*sheet.w+x*8;mask.fill(1,start,start+8);
    }
    const old=sheet.colors.map(colorWord),hist=new Map(),locked=new Set([0]);
    if(mode==="generate")sheet.indices.forEach((v,i)=>{
        const x=i%sheet.w,y=Math.floor(i/sheet.w);
        if(x<dx || x>=dx+w || y<dy || y>=dy+h)locked.add(v);
    });
    const input=new Int32Array(w*h).fill(-1);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const from=((sy+y)*width+sx+x)*4,cell=(dy+y)*sheet.w+dx+x;
        const alpha=pixels[from+3];if(!alpha)continue;
        if(alpha!==255)throw Error("Use opaque pixels or complete transparency.");
        if(!mask[cell])throw Error("Opaque pixel at ("+(dx+x)+", "+(dy+y)+") is outside the allocated sprite mask.");
        const rgb=pixels.subarray(from,from+3),word=colorWord(rgb);
        if(mode==="index"){
            const ink=Math.round(rgb[0]*(old.length-1)/255);
            if(!ink || !rgb.every(c=>c===Math.round(ink*255/(old.length-1))))throw Error("Unknown indexed grayscale value.");
            input[y*w+x]=ink;
        }else{
            if(mode==="exact" && !sheet.colors.some((c,i)=>i && c.every((v,ch)=>v===rgb[ch])))
                throw Error("Pixel ("+(sx+x)+", "+(sy+y)+") is outside the game palette. Choose nearest colors or generate a palette.");
            input[y*w+x]=word;hist.set(word,(hist.get(word)??0)+1);
        }
    }
    const words=mode==="generate"?generateColors(old,locked,hist):old;
    const best=new Map();
    for(const c of hist.keys()){
        let slot=1;
        for(let i=2;i<words.length;i++)if(colorDistance(c,words[i])<colorDistance(c,words[slot]))slot=i;
        best.set(c,slot);
    }
    const indices=sheet.indices.slice();let approximated=0,changedPixels=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const at=(dy+y)*sheet.w+dx+x,c=input[y*w+x],prior=indices[at];
        let slot=0;
        if(c>=0){
            slot=mode==="index"?c:prior && words[prior]===c?prior:best.get(c);
            if(mode!=="index" && c!==words[slot])approximated++;
        }
        if(slot!==prior){indices[at]=slot;changedPixels++;}
    }
    const changed=words.map((c,i)=>c!==old[i]?i:0).filter(Boolean);
    return {sheet,indices,words,changed,changedPixels,approximated,distinct:hist.size,mode};
}
function writeImportPalette(s,kind,id,palette,sub,plan){
    if(!plan.changed.length)return;
    const off=plan.sheet.paletteOffset;
    if(kind==="tiles" || kind==="layer3"){
        const start=sub*(kind==="tiles"?16:4);
        for(const i of plan.changed)s.set("fieldPalettes",palette,"c"+(start+i),plan.words[i]);
        return;
    }
    if(kind==="world" && id===2){
        const assets=sessionAssets(s),bytes=unpackLayout(assets.packed("trenchPalette",0));
        for(const i of plan.changed){
            const at=off+2*i;writeLE(bytes,at,(u16(bytes,at)&32768)|plan.words[i],2);
        }
        saveLayer(assets,0,bytes,"trenchPalette");return;
    }
    const rom=s.original;
    const guard={monster:[0x1233d,0xf87b98,0x387b98,0x38b018],sprite:[0x50ed,0xe68000,0x268000,0x268400],world:[0x2e8a71,0xd2ec00,0x12ec00,0x12ee00]}[kind];
    if(!guard || rom[guard[0]]!==191 || readLE(rom,guard[0]+1,3)!==guard[1] || off<guard[2] || off+plan.words.length*2>guard[3])
        throw Error("The game's palette reader or allocation differs from Regular.");
    const edits=graphicEdits(s);
    for(const i of plan.changed){
        const at=off+2*i,bytes=edits.bytes(at,2);
        writeLE(bytes,0,(u16(bytes,0)&32768)|plan.words[i],2);
        edits.replace(at,bytes,"Import palette color");
    }
}
function applyGraphicImport(s,kind,id,palette,sub,plan){
    const sheet=graphicSheet(s,kind,id,palette,sub);
    if(sheet.at!==plan.sheet.at || sheet.paletteOffset!==plan.sheet.paletteOffset || !sameBytes(sheet.indices,plan.sheet.indices) ||
        !sameBytes(sheet.colors.map(colorWord),plan.sheet.colors.map(colorWord)))
        throw Error("The destination changed. Preview the import again.");
    if(!plan.changed.length && !plan.changedPixels)return;
    const model=s.model,redo=model.redoStack,outer=model.actionDepth;
    model.beginAction();
    const group=model.action,start=group.length;
    try{
        writeImportPalette(s,kind,id,palette,sub,plan);
        writeSheetPixels(s,kind,id,sheet,plan.indices);
    }catch(error){
        // Remove only this import's actions, including when a caller has an open group.
        for(const action of group.splice(start).reverse()){
            action.execute(true);action.object?.markAsDirty();
        }
        if(!outer && !group.length)model.action=null;
        model.endAction();model.redoStack=redo;
        throw error;
    }
    model.endAction();
}
