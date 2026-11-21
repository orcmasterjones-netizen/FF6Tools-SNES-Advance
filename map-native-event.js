// Read original branch destinations in place, preserving their native entry points. GPL-3.0.
"use strict";
function nativeFieldBlock(rom,offset){
    const out=[];
    for(let at=0xa0000+offset;at>=0xa0000 && at<rom.length && out.length<100;){
        const op=rom[at],meta=FIELD_OPS[op],args=rom.subarray(at+1,at+5),n=meta?fieldLength(op,args):null;
        const row={offset:at-0xa0000,name:meta?.[2]||hex(op),links:[]};out.push(row);
        if(!n || n<1 || at+n>rom.length){row.name+=" (variable or unknown length)";break;}
        if(op===0x48 || op===0x4b)row.dialogue=mapDialogue("dialogue "+readLE(rom,at+1,2));
        if(op===0xb2)row.links.push(["Called routine",readLE(rom,at+1,3)]);
        if(op>=0xc0 && op<=0xcf){
            row.links.push(["Branch taken",readLE(rom,at+n-3,3)],["Fall through",at+n-0xa0000]);break;
        }
        if(op===0xfe || op===0xff || [0x6a,0x6b,0xb7,0xbd,0xbe,0xa0].includes(op))break;
        at+=n;
    }
    return out;
}
function nativeFieldInspector(panel,s,offset){
    const controls=element("div"),body=element("div"),trail=[];
    panel.append(controls,body);
    function show(at){
        controls.replaceChildren();body.replaceChildren();
        if(trail.length)controls.append(toolButton("Back to caller",()=>show(trail.pop())));
        const list=element("select");list.size=5;list.className="map-commands";list.setAttribute("aria-label","Original event instructions");
        const more=element("div"),block=nativeFieldBlock(s.original,at);
        block.forEach((r,i)=>list.add(new Option(hex(0xca0000+r.offset,6)+"  "+r.name+(r.dialogue?" "+hex(r.dialogue.id,3):""),i)));
        body.append(list,more);
        function select(){
            more.replaceChildren();const row=block[+list.value];if(!row)return;
            for(const [label,addr] of row.links)if(addr+0xa0000<s.original.length){
                more.append(toolButton(label+" "+hex(0xca0000+addr,6),()=>{trail.push(at);show(addr);}));
            }
            if(row.dialogue?.key){more.append(element("p","This dialogue ID is shared by all events that display it."));dialoguePanel(more,row.dialogue.key,row.dialogue.index);}
        }
        list.onchange=select;select();
    }
    controls.append(toolButton("Inspect original routine "+hex(0xca0000+offset,6),()=>show(offset)));
}
