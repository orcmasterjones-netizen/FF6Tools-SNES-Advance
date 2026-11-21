// In-place field dialogue editing in the three Regular text tables. GPL-3.0.
"use strict";
const glyphSequences=Object.entries(FIELD_GLYPHS)
    .filter(([n,text])=>Number(n)>=32 && !text.startsWith("\\"))
    .sort((a,b)=>b[1].length-a[1].length);
function fieldTextParts(bytes) {
    const parts=[];let run=[],text="";
    function flush(){parts.push({text,bytes:Uint8Array.from(run)});run=[];text="";}
    for(let i=0;i<bytes.length;){
        const byte=bytes[i++],glyph=FIELD_GLYPHS[byte];
        if(byte===0){flush();return parts;}
        if(byte<32 && !glyph)throw Error("Unknown field text control "+hex(byte)+".");
        if(byte>=32 && glyph && !glyph.startsWith("\\")){
            run.push(byte);text+=glyph;continue;
        }
        flush();
        const args=[byte];
        if([17,20,22].includes(byte)){
            if(i>=bytes.length)throw Error("Truncated field text control.");
            args.push(bytes[i++]);
        }
        parts.push({label:(glyph||hex(byte)).replace(/^\\/,"").replace(/\[$/,"")+(args.length===2?" "+hex(args[1]):""),bytes:Uint8Array.from(args)});
    }
    throw Error("Text ends outside this slot.");
}
function encodeRun(text){
    text=text.replaceAll("'","’");
    const result=[];
    for(let p=0;p<text.length;){
        const pair=glyphSequences.find(([,g])=>text.startsWith(g,p));
        if(!pair)throw Error("The field font cannot encode "+JSON.stringify(text[p])+".");
        result.push(Number(pair[0]));p+=pair[1].length;
    }
    return Uint8Array.from(result);
}
class FieldDialogue {
    constructor(session){
        this.session=session;this.edits=new Map();this.names=new Map();
        const bytes=session.original;
        const reader=Uint8Array.from(TEXT_READER.match(/../g),s=>parseInt(s,16));
        if(!sameBytes(reader,bytes.subarray(0xd66f,0xd66f+reader.length)) || readLE(bytes,0x7fbf,3)!==0xd66f4c || readLE(bytes,0xce600,2)!==1574)
            throw Error("The field dialogue dispatcher differs from Regular.");
        for(const [key,slots] of Object.entries(TEXT_LAYOUT)){
            const table=tables[key];
            for(const [i,[at]] of slots.entries())if(readLE(bytes,table.start+i*2,2)!==(at&65535))
                throw Error("The field dialogue pointer table was relocated or repacked.");
        }
    }
    bytes(key,id){
        const [at,cap]=TEXT_LAYOUT[key][id];
        if(!cap)throw Error("This slot shares a suffix or has no independently terminated text.");
        return this.edits.get(at)||this.session.original.subarray(at,at+cap);
    }
    searchText(key,id){
        const [at]=TEXT_LAYOUT[key][id];
        if(!this.names.has(at)){
            let label="";
            try{label=fieldTextParts(this.bytes(key,id)).map(p=>p.text??" ").join("").replace(/\s+/g," ").trim();}
            catch{}
            this.names.set(at,label);
        }
        return this.names.get(at);
    }
    replace(key,id,index,text){
        const [at,cap,refs]=TEXT_LAYOUT[key][id];
        if(refs!==1)throw Error("This text has multiple references.");
        const original=this.session.original.subarray(at,at+cap);
        const parts=fieldTextParts(this.bytes(key,id)),stock=fieldTextParts(original);
        if(!parts[index] || parts[index].text===undefined)throw Error("Select a text run.");
        if(parts[index].text===text)return;
        // Empty runs between controls keep stable indices for subsequent changes.
        const replacement=stock[index]?.text===text?stock[index].bytes:encodeRun(text);
        const bytes=Uint8Array.from([...parts.flatMap((p,i)=>Array.from(i===index?replacement:p.bytes)),0]);
        if(bytes.length>cap)throw Error("This edit needs "+bytes.length+" encoded bytes. The slot holds "+cap+".");
        const used=stock.reduce((n,p)=>n+p.bytes.length,1);
        const next=sameBytes(bytes,original.subarray(0,used))?null:bytes;
        const previous=this.edits.get(at),apply=b=>{this.names.delete(at);if(b)this.edits.set(at,b);else this.edits.delete(at);};
        this.session.model.doAction(new ROMAction(null,()=>apply(previous),()=>apply(next),"Edit field dialogue"));
    }
    write(out){for(const [at,b] of this.edits)out.set(b,at);return this.edits.size>0;}
}
function dialoguePanel(panel,key,id,onEdit){
    let editor,parts;
    try {
        editor=session.dialogue ||= new FieldDialogue(session);parts=fieldTextParts(editor.bytes(key,id));
    }catch(e){panel.append(element("p",e.message));return;}
    const [at,cap,refs]=TEXT_LAYOUT[key][id];
    const counter=element("p");panel.append(counter);
    function refreshSize(){
        const used=fieldTextParts(editor.bytes(key,id)).reduce((n,p)=>n+p.bytes.length,1);
        counter.textContent="Text at "+hex(0xc00000+at,6)+" · "+used+" of "+cap+" encoded bytes. Each box is a text run between game controls. Changes apply when you leave the box.";
    }
    refreshSize();
    if(refs>1)panel.append(element("p","Read-only shared text · "+refs+" dialogue IDs use this address."));
    for(const [i,p] of parts.entries()){
        if(p.text===undefined){const code=element("code",p.label==="n"?"Line break":p.label);code.className="text-control";panel.append(code);continue;}
        const box=element("textarea");box.className="text-run";box.value=p.text;box.disabled=refs>1;box.setAttribute("aria-label","Dialogue text run "+(i+1));
        box.onchange=()=>{
            try{editor.replace(key,id,i,box.value);p.text=fieldTextParts(editor.bytes(key,id))[i].text;box.value=p.text;buttons();refreshSize();onEdit?.();message("Field dialogue updated.");}
            catch(e){box.value=p.text;message(e.message,true);}
        };panel.append(box);
    }
}
