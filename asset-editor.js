// Monster AI and compressed field layer storage for SNES Advance Regular. GPL-3.0.
"use strict";
const AI_COMMANDS = [
    ["choose",3], ["target",1], ["formation",3], ["message",2],
    ["command",3], ["show_hide",3], ["item",3], ["event",1],
    ["variable",2], ["switch",3], ["animation",3], ["effect",2],
    ["if",3], ["wait",0], ["end_block",0], ["end",0]
];
const assetKinds = {
    scripts:{table:0x387810, stride:2, base:0x390000, pool:[0x395600,0x39fff0], guard:"Monster AI"},
    layouts:{table:0x30076a, stride:3, base:0x19d1b0, pool:[0x330000,0x33e000], guard:"Field tiles"},
    worlds:{sites:[0x2eb20f,0x2eb224,0x2eb227],stride:3,base:-0xc00000,pool:[0x314200,0x31ff00],guard:"World tiles"}
};
function assetPointer(spec,id) { return spec.sites ? spec.sites[id] : spec.table+id*spec.stride; }
function readLE(bytes, at, count) {
    let n=0;
    for(let i=0;i<count;i++) n+=bytes[at+i]*2**(8*i);
    return n;
}
function sameBytes(a,b) { return a.length===b.length && a.every((v,i)=>v===b[i]); }
function scriptLength(bytes, start, limit) {
    let pos=start, ends=0;
    while(pos<limit) {
        const op=bytes[pos];
        pos+=op<240 ? 1 : 1+AI_COMMANDS[op-240][1];
        if(pos>limit)break;
        if(op===255 && ++ends===2)return pos-start;
    }
    throw Error("Monster script has a truncated command or is missing its second end.");
}
function printScript(data, rom) {
    const text=[];
    let ended=false;
    for(let i=0;i<data.length;) {
        const op=data[i++], count=op<240?0:AI_COMMANDS[op-240][1];
        const args=op<240?[op]:Array.from(data.subarray(i,i+count));
        let line=[op<240?"attack":AI_COMMANDS[op-240][0],...args.map(n=>hex(n))].join(" ");
        if(op<240 || op===240)line+="  # "+args.map(n=>n===254?"No attack":battleAttackName(rom,n)).join(" / ");
        const labels=op===0xfc?WORK_LAYOUT.labels.condition:op===0xfb?WORK_LAYOUT.labels.effect:op===0xf1?WORK_LAYOUT.labels.target:null;
        if(labels?.[args[0]])line+="  # "+labels[args[0]];
        text.push(line);
        if(op===255 && !ended) {text.push("","# Counter script");ended=true;}
        i+=count;
    }
    return text.join("\n");
}
function assembleScript(text) {
    const out=[];
    for(const [i,line] of text.split(/\r?\n/).entries()) {
        const body=line.split("#")[0].trim();
        if(!body)continue;
        const [command,...tokens]=body.toLowerCase().split(/[\s,]+/);
        const index=AI_COMMANDS.findIndex(c=>c[0]===command);
        if(index<0 && command!=="attack")throw Error("Line "+(i+1)+" has an unknown command.");
        const count=index<0?1:AI_COMMANDS[index][1];
        if(tokens.length!==count)throw Error("Line "+(i+1)+" needs "+count+" operand(s).");
        const args=tokens.map(token=>{
            const base=token.startsWith("$") || token.startsWith("0x")?16:10;
            if(!/^(?:\$[a-f0-9]{1,2}|0x[a-f0-9]{1,2}|[0-9]{1,3})$/.test(token))throw Error("Invalid byte on line "+(i+1)+".");
            const value=parseInt(token.replace(/^\$|^0x/,""),base);
            if(value>255)throw Error("Operand exceeds 255 on line "+(i+1)+".");
            return value;
        });
        if(index<0 && args[0]>=240)throw Error("Single attacks use $00–$EF. Use the named instruction for an opcode.");
        if(index>=0)out.push(240+index);
        out.push(...args);
    }
    const bytes=Uint8Array.from(out);
    if(scriptLength(bytes,0,bytes.length)!==bytes.length)throw Error("Commands follow the end of the counter script.");
    return bytes;
}

class RegularAssets {
    constructor(session) {
        this.session=session;
        this.source=session.original;
        this.stores={};
        this.plans={};
    }
    store(kind) {
        if(this.stores[kind])return this.stores[kind];
        const spec=assetKinds[kind], source=this.source;
        for(const [expected,sites] of Object.entries(WORK_LAYOUT.guards[spec.guard])) {
            const pattern=Uint8Array.from(expected.match(/../g),s=>parseInt(s,16));
            for(const pos of sites) if(!sameBytes(pattern,source.subarray(pos,pos+pattern.length)))
                throw Error(spec.guard+" reader changed at "+hex(0xc00000+pos,6)+".");
        }
        const [lo,hi]=spec.pool;
        const stock=WORK_LAYOUT[kind];
        const rows=stock.map((row,id)=>{
            const ptr=readLE(source,assetPointer(spec,id),spec.stride);
            if(!row) {
                if(ptr!==65535)throw Error("Reserved monster pointer in use.");
                return null;
            }
            const at=spec.base+ptr;
            const inPool=at>=lo && at<hi;
            if(at!==row[0] && !inPool)throw Error(spec.guard+" record "+hex(id,3)+" uses a different storage layout.");
            const limit=inPool?hi:at+row[1];
            const size=kind==="scripts"?scriptLength(source,at,limit):readLE(source,at,2);
            if(size<2 || at+size>limit)throw Error("Asset size exceeds its verified allocation at "+hex(at,6)+".");
            return {at,size,capacity:inPool?size:row[1],inPool};
        });
        const covered=new Uint8Array(hi-lo);
        for(const row of rows)if(row?.inPool)covered.fill(1,row.at-lo,row.at-lo+row.size);
        const poolClear=source.subarray(lo,hi).every((b,i)=>b===255 || covered[i]);
        return this.stores[kind]={rows,edits:new Map(),poolClear};
    }
    packed(kind,id) {
        const {rows,edits}=this.store(kind),row=rows[id];
        if(!row)throw Error("Unavailable record.");
        return edits.get(id) || this.source.subarray(row.at,row.at+row.size);
    }
    plan(kind, edits) {
        const {rows,poolClear}=this.store(kind),spec=assetKinds[kind], [lo,hi]=spec.pool;
        const occupied=[],moving=[],writes=[];
        for(let id=0;id<rows.length;id++){
            const row=rows[id];if(!row)continue;
            const bytes=edits.get(id);
            // Distinct IDs can share an entire script, or start in another script's suffix.
            const shared=bytes && rows.some((other,j)=>other && j!==id && other.at<row.at+bytes.length && row.at<other.at+other.size);
            // Never re-use released tails in an existing pool allocation unless cleared below.
            if(bytes && (bytes.length>row.capacity || shared))moving.push({id,bytes});
            else {
                if(bytes)writes.push({at:row.at,bytes});
                if(row.inPool)occupied.push([row.at,row.at+(bytes?.length??row.size)]);
            }
        }
        if(moving.length && !poolClear)throw Error("Another modification occupies the "+spec.guard+" expansion area. This edit needs more space.");
        occupied.sort((a,b)=>a[0]-b[0]);
        for(const {id,bytes} of moving) {
            let at=lo;
            for(const [a,b] of occupied) {
                if(at+bytes.length<=a)break;
                at=Math.max(at,b);
            }
            if(at+bytes.length>hi)throw Error("The "+spec.guard+" expansion area is full.");
            occupied.push([at,at+bytes.length]);occupied.sort((a,b)=>a[0]-b[0]);
            const ptr=at-spec.base;
            writes.push({at,bytes},{at:assetPointer(spec,id),
                bytes:Uint8Array.from({length:spec.stride},(_,i)=>(ptr>>>(8*i))&255)});
        }
        // Clear only formerly referenced pool bytes. Live aliases and new payloads
        // are restored after this pass; unrelated occupied bytes are never touched.
        const clears=[];
        for(const [id] of edits) {
            const row=rows[id];if(!row.inPool)continue;
            let start=row.at;
            for(const [a,b] of occupied) {
                if(a>start)clears.push([start,Math.min(a,row.at+row.size)]);
                start=Math.max(start,b);
                if(start>=row.at+row.size)break;
            }
            if(start<row.at+row.size)clears.push([start,row.at+row.size]);
        }
        return {writes,clears};
    }
    set(kind,id,bytes) {
        const {edits,rows}=this.store(kind),row=rows[id];
        if(!row || (kind==="layouts" && !id))throw Error("Reserved record.");
        if(kind==="scripts" && scriptLength(bytes,0,bytes.length)!==bytes.length)throw Error("Trailing script data.");
        if(kind!=="scripts" && readLE(bytes,0,2)!==bytes.length)throw Error("Invalid packed layout length.");
        if(sameBytes(bytes,this.packed(kind,id)))return;
        const before=edits.get(id);
        const original=this.source.subarray(row.at,row.at+row.size);
        const after=sameBytes(bytes,original)?null:bytes.slice();
        const next=new Map(edits);
        if(after)next.set(id,after);else next.delete(id);
        const plan=this.plan(kind,next), previous=this.plans[kind];
        const apply=(value,p)=>{if(value)edits.set(id,value);else edits.delete(id);this.plans[kind]=p;};
        this.session.model.doAction(new ROMAction(null,()=>apply(before,previous),()=>apply(after,plan),"Edit "+kind));
    }
    write(output) {
        let changed=false;
        for(const plan of Object.values(this.plans))if(plan) {
            for(const [a,b] of plan.clears)output.fill(255,a,b);
            for(const w of plan.writes)output.set(w.bytes,w.at);
            if(plan.writes.length)changed=true;
        }
        return changed;
    }
}
function sessionAssets(session) {return session.assets ||= new RegularAssets(session);}
