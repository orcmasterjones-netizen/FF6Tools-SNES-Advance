// FFVI field event and battle event languages. All addresses in source are offsets from $CA0000.
"use strict";
const BATTLE_OPS=[
    ["message",1],["dialogue",1],["noop",0],...Array.from({length:4},(_,i)=>["actor"+(i+1),3]),
    ...Array.from({length:6},(_,i)=>["enemy"+(i+1),3]),["attack_animation",3],["reset",0],["play",0],
    ["close_window",0],["open_window",0],["actor_table",48],["character_target",1],["character_menu",1]
];
function numberToken(str,max){
    const s=String(str);
    if(!/^(?:\$[\da-f]+|0x[\da-f]+|\d+)$/i.test(s))throw Error("Expected a number, found "+s+".");
    return integer(Number(s.replace(/^\$/,"0x")),0,max,"Operand");
}
function sourceLines(source){
    return source.split(/\r?\n/).map((s,i)=>({words:s.split("#")[0].trim().split(/[\s,]+/),line:i+1})).filter(v=>v.words[0]);
}
function assembleBattle(source){
    const bytes=[];
    for(const {words:[name,...args],line} of sourceLines(source)){
        if(bytes.ended)throw Error("Line "+line+" follows end.");
        if(name==="end" && !args.length){bytes.push(255);bytes.ended=true;continue;}
        const op=BATTLE_OPS.findIndex(v=>v[0]===name);
        if(op<0 || args.length!==BATTLE_OPS[op][1])throw Error("Invalid battle command or operand count on line "+line+".");
        bytes.push(op,...args.map(n=>numberToken(n,255)));
    }
    if(!bytes.ended)throw Error("Finish the battle event with end.");
    return Uint8Array.from(bytes);
}
function printBattle(bytes){
    const lines=[];
    for(let i=0;i<bytes.length;){
        const op=bytes[i++];if(op===255){lines.push("end");break;}
        const [name,n]=BATTLE_OPS[op];lines.push([name,...Array.from(bytes.subarray(i,i+n),v=>hex(v))].join(" "));i+=n;
    }
    return lines.join("\n");
}
function fieldLength(op,args){
    if(op<0x35)return 2+(args[0]&127);
    if(op===0x73 || op===0x74)return 5+args[2]*args[3];
    if(op===0xbe)return 2+3*(args[0]&15);
    if(op>=0xc0 && op<=0xcf)return 6+2*(op&7);
    if(op===0xb6)return null; // Number of choices comes from the preceding dialogue.
    return FIELD_OPS[op]?.[1];
}
function assembleField(source,address){
    const out=[],labels=new Map(),fixups=[];
    const word=n=>out.push(n&255,(n>>>8)&255);
    function dest(s){fixups.push([out.length,s]);out.push(0,0,0);}
    let last=null;
    for(const {words:[cmd,...args],line} of sourceLines(source)){
        try{
            if(cmd.endsWith(":")){
                const label=cmd.slice(0,-1);
                if(args.length||!/^\w+$/.test(label)||labels.has(label))throw Error("Invalid or repeated label.");
                labels.set(label,address+out.length-0xa0000);continue;
            }
            const count=n=>{if(args.length!==n)throw Error(cmd+" takes "+n+" operands.");};
            const num=(i,max=255)=>numberToken(args[i],max);
            last=cmd;
            switch(cmd){
            case "return":count(0);out.push(254);break;
            case "end":count(0);out.push(255);break;
            case "dialogue":count(1);out.push(0x4b);word(num(0,65535));break;
            case "give_item":count(1);out.push(0x80,num(0));break;
            case "give_gp":count(1);out.push(0x84);word(num(0,65535));break;
            case "set_bit":case "clear_bit":{
                count(1);const bit=num(0,0x6ff);out.push(0xd0+2*(bit>>8)+(cmd==="clear_bit"?1:0),bit&255);break;
            }
            case "call":count(1);out.push(0xb2);dest(args[0]);break;
            case "if_set":case "if_clear":count(2);out.push(0xc0);word(num(0,0x6ff)|(cmd==="if_set"?32768:0));dest(args[1]);break;
            case "bytes":if(!args.length)throw Error("Enter event bytes.");out.push(...args.map(n=>numberToken(n,255)));break;
            default:{
                const match=/^([a-zA-Z][\w]*)_([0-9a-f]{2})$/i.exec(cmd),op=match?parseInt(match[2],16):-1;
                if(!match || FIELD_OPS[op]?.[0]!==match[1])throw Error("Unknown command "+cmd+".");
                const operands=args.map(v=>numberToken(v,255)),length=fieldLength(op,operands);
                if(length!==null && operands.length+1!==length)throw Error("Wrong operand count.");
                if(op===0xb6 && (!operands.length || operands.length%3))throw Error("Choice destinations need three bytes each.");
                out.push(op,...operands);
            }}
        }catch(e){throw Error("Line "+line+" · "+e.message);}
    }
    if(last!=="return" && last!=="end")throw Error("Finish the field event with return or end.");
    for(const [at,s] of fixups){
        const n=labels.has(s)?labels.get(s):numberToken(s,0x35ffff);
        writeLE(out,at,n,3);
    }
    return Uint8Array.from(out);
}
function existingSceneSource(rom,offset){
    let at=0xa0000+offset;
    const lines=[],start=at;
    // Keep uncertain or multi-entry continuations at their original address.
    for(let step=0;step<160 && at<rom.length;step++){
        const op=rom[at],meta=FIELD_OPS[op];
        if(op===254 || op===255){lines.push(op===254?"return":"end");return lines.join("\n");}
        const len=meta?fieldLength(op,rom.subarray(at+1,at+5)):null;
        if(!len || op===0xb6 || op===0xbe || op>=0xc0&&op<=0xcf || [0x6a,0x6b,0xb7,0xbd,0xa0].includes(op))break;
        if(at+len>rom.length)break;
        if(op===0xb2)lines.push("call "+hex(readLE(rom,at+1,3),6));
        else if(op===0x4b)lines.push("dialogue "+hex(readLE(rom,at+1,2),4));
        else lines.push([meta[0]+"_"+op.toString(16).padStart(2,"0"),...Array.from(rom.subarray(at+1,at+len),b=>hex(b))].join(" "));
        at+=len;
    }
    lines.push("# Continue at the existing event"+(at===start?" entry.":" branch or continuation."),"call "+hex(at-0xa0000,6),"return");return lines.join("\n");
}
