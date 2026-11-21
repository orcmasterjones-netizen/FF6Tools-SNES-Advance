// Offline UI for the SNES Advance profile, 2026-11-21. GPL-3.0.
"use strict";
const el=id=>document.getElementById(id);
function element(tag,text) {const node=document.createElement(tag);node.textContent=text||"";return node;}
let session, current="monsters", selected=451, filename, lastExport, loading=0;
let workshopMode=null, mapView={};
const scriptDrafts=new Map();
const unsaved=()=>session && (graphicDrafts.size>0 || scriptDrafts.size>0 || authorDrafts.size>0 || session.model.undoStack.at(-1)!==lastExport);
const initial={monsters:451,loot:451,items:256,espers:27,maps:415,formations:579,addedMagic:2};
function message(s,error=false) {el("status").textContent=s;el("status").classList.toggle("error",error);}
function buttons(){
    el("save").disabled=!session;
    el("undo").disabled=!session?.model.undoStack.length;
    el("redo").disabled=!session?.model.redoStack.length;
}
function selectTable(key,mode=null){
    workshopMode=mode;mapView={};
    current=key;selected=mode==="mapEditor"?20:mode && dialogKeys.includes(mode) && key!=="maps"?0:initial[key]??0;el("search").value="";
    for(const b of el("tabs").children)b.classList.toggle("active",b.dataset.key===(mode||key));
    records(); detail();
}
function addTab(key,label,table=key,mode=null){
    const button=element("button",label);
    button.className="tab";
    button.dataset.key=key;
    button.disabled=true;
    button.onclick=()=>selectTable(table,mode);
    el("tabs").append(button);
}
addTab("mapEditor","Map editor","maps","mapEditor");
for(const [key,t] of Object.entries(tables)){
    addTab(key,t.name);
    if(key==="monsters")addTab("monsterScripts","Monster scripts",key,"monsterScripts");
    if(key==="maps")addTab("mapTiles","Map tiles",key,"mapTiles");
}
for(const [mode,[label,table]] of Object.entries(AUTHOR_TABS))addTab(mode,label,table,mode);
function records(){
    const rows=el("records"), prev=selected, term=el("search").value.trim().toLowerCase();
    rows.replaceChildren();const frag=document.createDocumentFragment();
    let dialog=null;
    if(tables[current].dialogue){try{dialog=session.dialogue ||= new FieldDialogue(session);}catch{}}
    const override=workshopMode?authorRecords(workshopMode,session):null;
    for(let i=0;i<(override?.length??tables[current].count);i++){
        if(!override && !permitted(current,i))continue;
        const line=dialog?.searchText(current,i);
        const label=current==="worldTerrain"?(i<256?"Balance ":"Ruin ")+hex(i&255):hex(visibleId(current,i),3)+"  "+(override?override[i]:line?line.slice(0,70):session.name(current,i));
        const id=visibleId(current,i);
        if(term && !label.toLowerCase().includes(term) && !line?.toLowerCase().includes(term) && term!==String(id) && term!=="$"+id.toString(16))continue;
        frag.append(new Option(label,i));
    }
    rows.append(frag);rows.value=String(prev);
    if(rows.selectedIndex<0 && rows.length)rows.selectedIndex=0;
    selected=rows.length?Number(rows.value):-1;
}
el("search").oninput=()=>{records();detail();};
el("records").onchange=()=>{selected=Number(el("records").value);detail();};
const notes={
    formations:"Each slot has a nine-bit monster ID and its own active flag. Choosing Empty also clears that flag.",
    loot:"Each steal or drop holds one byte. $FF means nothing. The 15 added equipment records use a different representation.",
    espers:"Regular awards Flood, Gravija and Valor through dedicated battle routines. Fixed teaching slots are shown read-only. Other editable slots can teach the original 54 spells.",
    mapTreasure:"The reward byte is an item ID for item chests, a battle-group index for monster chests, or GP in hundreds. Opened-chest flags can be shared.",
    mapEvents:"X and Y move the trigger. The offset identifies the existing field event.",
    maps:"The three layer IDs identify the tile layouts this map uses. Song and random battles are editable.",
    addedMagic:"These are player spell records. Throw and enemy attacks that use the same ID read separate records.",
    addedSummons:"Gilgamesh has four distinct attack records. The battle routine selects an outcome.",
    items:"Bytes 20 and 21 have different meanings by item type. Some special effects use their own battle logic."
};
function refreshControl(input,key,prop,spec) {
    if(spec.bool)input.checked=Boolean(prop.value);else input.value=String(prop.value);
}
function control(key,spec,row){
    const prop=row[key],label=element("label",current==="items"?session.itemFieldLabel(selected,key):spec.name);
    let input;
    if(spec.domain){
        input=element("select");
        for(const [id,fallback] of Object.entries(fieldChoices(session,current,selected,key))){
            const n=Number(id), name=spec.domain==="roster" && n!==511 ? session.name("monsters",n) :
                spec.domain==="loot" && n!==255 ? session.name("items",n) : fallback;
            input.add(new Option(hex(n,spec.domain==="roster"?3:2)+"  "+name,id));
        }
        if(!Object.hasOwn(fieldChoices(session,current,selected,key),prop.value))
            input.add(new Option(hex(prop.value)+"  (existing value)",prop.value));
    } else {
        input=element("input");input.type=spec.bool?"checkbox":"number";
        if(!spec.bool){input.min=0;input.max=spec.max??prop.max;input.step=spec.multiplier||1;}
    }
    input.id="field-"+key;input.disabled=Boolean(spec.readOnly || fixedTeaching(current,selected,key));label.htmlFor=input.id;
    refreshControl(input,key,prop,spec);
    input.onchange=()=>{
        try {
            if(!spec.bool && (input.value==="" || !input.checkValidity()))throw Error("Enter a value within the displayed field’s range.");
            session.set(current,selected,key,spec.bool?input.checked:Number(input.value));
            if(current==="formations" && spec.domain==="roster")el("field-"+key+"Present").checked=Boolean(row[key+"Present"].value);
            if(current==="formations"){const old=el("preview"),next=drawFormation(session,selected);next.id="preview";old.replaceWith?.(next);}
            message("Editing "+filename+" · "+spec.name+" updated");
        } catch(e){refreshControl(input,key,prop,spec);message(e.message,true);}
        buttons();
    };
    label.append(input);return label;
}
function detail(){
    mapWorkspacePanel.observer?.disconnect();
    const panel=el("detail");panel.replaceChildren();
    if(selected<0){panel.append(element("h1","No matching records"));return;}
    if(workshopMode==="mapEditor"){try{mapWorkspacePanel(panel,selected);}catch(e){panel.append(element("p",e.message));}return;}
    if(current==="maps" && !workshopMode)panel.append(toolButton("Open map editor",()=>jumpTo("mapEditor",selected)));
    if(dialogKeys.includes(workshopMode)){showAuthor(panel,workshopMode,selected);return;}
    if(workshopMode==="mapTiles" && selected>=431){panel.append(element("h1",selectedRoomName(session,selected)));fieldPanel(panel,selected);return;}
    const t=tables[current],row=session.row(current,selected);
    panel.append(element("h1",session.name(current,selected)));
    const at=t.start+t.width*selected;
    const addr=element("p","ID "+hex(visibleId(current,selected),3)+"   ·   SNES "+hex(0xc00000+at,6)+"   ·   "+t.width+" bytes");addr.className="address";panel.append(addr);
    addWorkshop(panel,current,selected);
    if(workshopMode)return;
    if(t.dialogue){dialoguePanel(panel,current,selected);return;}
    if(current==="fieldPalettes"){palettePanel(panel,selected);return;}
    if(notes[current]){const p=element("p",notes[current]);p.className="note";panel.append(p);}
    const info=session.nameInfo(current,selected);
    if(info && current!=="loot"){
        const label=element("label","In-game name · "+info.cells.length+" characters");label.className="name-edit";
        const field=element("input");field.id="field-name";field.type="text";field.value=info.text;field.disabled=!info.editable;
        field.onchange=()=>{
            try{session.rename(current,selected,field.value);records();detail();buttons();message(filename+" · Name updated");}
            catch(error){field.value=info.text;message(error.message,true);}
        };
        label.append(field);panel.append(label);
    }
    if(current==="formations"){
        const preview=drawFormation(session,selected);preview.id="preview";panel.append(preview);
    }
    function grid(parent){const node=element("div");node.className="grid";parent.append(node);return node;}
    let form;
    for(const [key,spec] of Object.entries(t.fields)){
        if(spec.hidden || (current==="items" && !session.itemFieldLabel(selected,key)))continue;
        if(current==="formations" && spec.domain==="roster"){
            const fs=element("fieldset");fs.className="group";fs.append(element("legend","Slot "+key.slice(-1)));panel.append(fs);form=grid(fs);
        }
        if(current==="items" && key==="equip0"){
            const fs=element("fieldset");fs.className="group";fs.append(element("legend","Can equip"));panel.append(fs);
            form=grid(fs);form.className="grid equip-grid";
        }
        if(!form)form=grid(panel);
        form.append(control(key,spec,row));
    }
}
el("rom-file").onchange=async event=>{
    const file=event.target.files[0];event.target.value="";
    if(!file)return;
    const token=++loading;

    try {
        const next=await openEditorFile(new Uint8Array(await file.arrayBuffer()));
        if(token!==loading)return;
        if(unsaved() && !confirm("Replace the current ROM and discard its unexported edits?"))return;
        session=next.session;graphicDrafts.clear();graphicViews.clear();scriptDrafts.clear();authorDrafts.clear();
        filename=next.revision ? file.name.replace(/\.(sfc|smc|bin)$/i,"")+"-Regular" : file.name;
        lastExport=undefined;
        for(const b of el("tabs").children)b.disabled=false;
        el("records").disabled=false;el("search").disabled=false;
        selectTable("monsters");buttons();
        if(next.revision) {
            message(file.name+" · Converted USA v"+next.revision+" to Regular v1.6.5. "+
                (next.modified?"Retail content edits preserved.":"Matches the official Regular ROM.")+
                (next.padded?" Replaced the blank 1 MiB padding.":"")+" Ready to edit or export.");
        } else message(filename+" · Regular v1.6");
    }catch(e){if(token===loading)message(e.message+(session?" Current ROM remains open.":""),true);}
};
for(const action of ["undo","redo"])el(action).onclick=()=>{
    const pending=Array.from(authorDrafts.values()).find(d=>d.mode==="mapEditor");
    if(pending){jumpTo(pending.mode,pending.id);mapView.target=pending.target;detail();message("Apply or discard the map event draft before changing history.",true);return;}
    session.model[action]();records();detail();buttons();message(filename+" · "+(action==="undo"?"Edit undone":"Edit restored"));
};
el("save").onclick=()=>{
    try {
        if(graphicDrafts.size){
            const {target}=graphicDrafts.values().next().value;
            graphicViews.set(target.kindID,target);jumpTo("graphicsSheets",target.kindID);
            throw Error("Apply or discard the graphic import preview before export.");
        }
        if(authorDrafts.size){
            const draft=authorDrafts.values().next().value;
            jumpTo(draft.mode,draft.id);
            if(draft.mode==="mapEditor"){mapView.target=draft.target;detail();}
            throw Error("Apply or discard the "+draft.title+" draft before export.");
        }
        if(scriptDrafts.size) {
            const id=scriptDrafts.keys().next().value;
            selectTable("monsters","monsterScripts");selected=id;records();detail();
            throw Error("Apply or discard the monster script draft for "+session.name("monsters",id)+" before export.");
        }
        const bytes=session.export(), name=filename.replace(/\.(sfc|smc|bin)$/i,"")+"-edited"+(session.header.length?".smc":".sfc");
        const download=new Blob([bytes],{type:"application/octet-stream"});
        const url=URL.createObjectURL(download);
        const a=element("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
        lastExport=session.model.undoStack.at(-1);
        message("Exported "+name);
        el("save").dispatchEvent(new CustomEvent("rom-exported",{detail:download}));
    }catch(e){message(e.message,true);}
};

window.addEventListener("beforeunload",event=>{if(unsaved()){event.preventDefault();event.returnValue="";}});
