"use strict";
function tileProperties(s,id){
    integer(id,0,41,"Collision set");
    const r=s.original,at=0x19a800+readLE(r,0x19cd10+2*id,2);
    const data=mapProject(s).state.collision[id],packed=data?fromHex(data):r.slice(at,at+readLE(r,at,2));
    const raw=unpackLayout(packed);
    if(raw.length!==512)throw Error("Unexpected tile-property set length.");
    return raw;
}
function setTileProperty(s,set,tile,word){
    integer(tile,0,255,"Tile");integer(word,0,65535,"Property word");
    const current=tileProperties(s,set);
    if((current[tile]|current[256+tile]<<8)===word)return;
    current[tile]=word&255;current[tile+256]=word>>8;
    const packed=ROM.dataFormat["ff6-lzss"].encode(current)[0];
    if(!sameBytes(unpackLayout(packed),current))throw Error("Collision compression failed.");
    mapProject(s).change("Edit tile collision",q=>{q.collision[set]=byteString(packed);});
}
function objectBytes(kind,v){
    const data=new Uint8Array(tables[kind].width);
    const n=(key,max)=>integer(Number(v[key]??0),0,max,key);
    if(kind==="mapNPCs"){
        writeLE(data,0,n("event",0x3ffff),3);data[2]|=n("palette",7)<<2;
        const flag=n("switch",1023);data[2]|=(flag&3)<<6;data[3]=flag>>2;
        data[4]=n("x",127);data[5]=n("y",63)|(n("speed",3)<<6);
        data[6]=n("sprite",164);data[8]=n("facing",3);
    }else{
        data[0]=n("x",255);data[1]=n("y",255);
        if(kind==="mapEvents")writeLE(data,2,n("event",0x35ffff),3);
        else if(kind==="mapTreasure"){
            const flag=n("switch",511),type=n("type",8);
            if(![0,2,4,8].includes(type))throw Error("Choose empty (0), battle (2), item (4), or GP (8).");
            data[2]=flag&255;data[3]=(flag>>8)|(type<<4);data[4]=n("reward",255);
        }else{
            const multi=kind==="longExits",i=multi?3:2;
            if(multi)data[2]=(integer(Number(v.length),1,128,"Length")-1)|(n("vertical",1)<<7);
            writeLE(data,i,n("destination",511)|(n("facing",3)<<12),2);
            data[i+2]=n("destX",255);data[i+3]=n("destY",255);
        }
    }return data;
}
function projectMapROM(s,map){
    const r=s.baseOutput();
    if(map>=431)r.set(fromHex(mapProject(s).state.rooms[map-431].record),tables.maps.start+map*33);
    return r;
}
const AUTHOR_TABS={
    metatiles:["Tileset composition","maps"],rooms:["Rooms and objects","maps"], fieldScenes:["Field cutscenes","maps"],
    battleEvents:["Battle events","monsters"],collision:["Tile collision","maps"],
    graphicsSheets:["Import graphics","monsters"],frames:["Animation frames","battleAnimations"]
};
const dialogKeys=["metatiles","rooms","fieldScenes","battleEvents","collision","graphicsSheets","frames"];
function authorRecords(mode,s){
    if(mode==="mapEditor" || mode==="rooms" || mode==="fieldScenes" || mode==="mapTiles"){
        const rooms=s.project?.state.rooms??[];
        return Array.from({length:431+rooms.length},(_,i)=>i<431?s.name("maps",i):rooms[i-431].name);
    }
    if(mode==="metatiles")return range(75).map(i=>"Field tileset "+i);
    if(mode==="battleEvents")return BATTLE_NAMES;
    if(mode==="collision")return range(42).map(i=>"Field tile set "+i);
    if(mode==="graphicsSheets")return ["Monster battle sprite","Field sprite sheet","Field tileset graphics","Layer 3 field graphics","World tileset graphics"];
    if(mode==="frames")return range(3025).map(i=>(i<2948?"Battle animation frame ":"Added animation frame ")+i);
    return null;
}
function labeled(parent,title,control){
    const label=element("label",title+" ");label.append(control);parent.append(label);return control;
}
function choices(parent,title,values){
    const e=element("select");e.setAttribute("aria-label",title);
    for(const [value,name] of values)e.add(new Option(name,String(value)));
    return labeled(parent,title,e);
}
function inputBox(parent,title,value,type="text"){
    const e=element("input");e.type=type;e.value=String(value);e.setAttribute("aria-label",title);
    return labeled(parent,title,e);
}
const authorDrafts=new Map();
function trackSource(area,title,extra){
    const mode=workshopMode,id=selected,key=mode+"/"+id;
    const snapshot=()=>({mode,id,title,text:area.value,...(extra?.read()??{})});
    const restore=authorDrafts.get(key);
    if(restore){extra?.restore(restore);area.value=restore.text;}
    const changed=()=>authorDrafts.set(key,snapshot());
    area.oninput=changed;
    return {changed,clear:()=>authorDrafts.delete(key),discard:()=>{authorDrafts.delete(key);detail();}};
}
function editorArea(parent,title,value){
    const e=element("textarea");e.className="ai-source";e.value=value;e.setAttribute("aria-label",title);
    e.id="author-source";
    parent.append(e);return e;
}
function doAuthor(fn,redraw=true){
    try{fn();buttons();if(redraw){records();detail();}message("Authoring edit applied.");}
    catch(e){message(e.message,true);}
}
function jumpTo(mode,id){
    selectTable(AUTHOR_TABS[mode]?.[1]??"maps",mode);selected=id;records();detail();
}
function stockObjectRows(s,map,kind){
    if(map>=431)return [];
    const g=MAP_OBJECT_INDEX[kind],w=tables[kind].width,rom=s.baseOutput();
    const a=g.base+readLE(rom,g.pointer+map*2,2),b=g.base+readLE(rom,g.pointer+map*2+2,2);
    return Array.from({length:(b-a)/w},(_,i)=>rom.slice(a+i*w,a+(i+1)*w));
}
function freeChestFlag(s){
    const used=new Set(),rom=s.baseOutput(),table=tables.mapTreasure;
    for(let i=0;i<table.count;i++)used.add(readLE(rom,table.start+i*table.width+2,2)&511);
    for(const o of mapProject(s).state.objects)if(o.kind==="mapTreasure")used.add(readLE(fromHex(o.data),2,2)&511);
    return range(512).find(i=>!used.has(i))??"";
}
function selectedRoomName(s,id){return id<431?s.name("maps",id):mapProject(s).state.rooms[id-431].name;}
function roomPanel(panel,id){
    const p=mapProject(session),state=p.state;
    panel.append(element("h1",selectedRoomName(session,id)),element("p","Map "+hex(id,3)),toolButton("Open map editor",()=>jumpTo("mapEditor",id)));
    if(id>=3 && id<431){
        const name=inputBox(panel,"Name for new room","New room");
        panel.append(toolButton("Create independent room",()=>doAuthor(()=>{
            const next=p.addRoom(id,name.value);jumpTo("rooms",next);
        },false)));
    }
    if(id>=431){
        panel.append(toolButton("Paint room",()=>jumpTo("mapTiles",id)));
        const name=inputBox(panel,"Room name",state.rooms[id-431].name);
        const raw=fromHex(state.rooms[id-431].record);
        const song=inputBox(panel,"Music ID",raw[28],"number");
        const rules=inputBox(panel,"Collision set",raw[4],"number"),pal=inputBox(panel,"Field palette",raw[25],"number");
        const ts=[0,1].map((layer)=>inputBox(panel,"Layer "+(layer+1)+" tileset",(readLE(raw,11+layer,2)>>(layer?1:2))&127,"number"));
        panel.append(toolButton("Save room properties",()=>doAuthor(()=>p.change("Room properties",s=>{
            const r=s.rooms[id-431],rec=fromHex(r.record);if(!name.value.trim())throw Error("Enter a room name.");
            rec[28]=integer(+song.value,0,255,"Music");rec[4]=integer(+rules.value,0,41,"Collision set");rec[25]=integer(+pal.value,0,48,"Palette");
            for(let l=0;l<2;l++){
                const sh=l?1:2,word=readLE(rec,11+l,2),v=integer(+ts[l].value,0,74,"Tileset");writeLE(rec,11+l,(word&~(127<<sh))|(v<<sh),2);
            }
            r.record=byteString(rec);r.name=name.value.trim();
        }))));
    }
    if(id>=3)panel.append(toolButton("Edit entrance cutscene",()=>jumpTo("fieldScenes",id)));
    panel.append(element("h2","Add a map object"));
    const kind=choices(panel,"Object type",Object.keys(OBJECT_DIRS).filter(k=>id>=3 || k==="mapEvents" || k==="shortExits").map(key=>[key,tables[key].name]));
    const form=element("div");panel.append(form);
    function fields(){
        form.replaceChildren();const k=kind.value,inputs={};
        const groups={mapNPCs:[["sprite",0],["palette",0],["facing",2],["speed",2],["switch",0],["event",EMPTY_SCENE]],
            mapTreasure:[["switch",k==="mapTreasure"?freeChestFlag(session):0],["type",4],["reward",0]],mapEvents:[["event",EMPTY_SCENE]],
            shortExits:[["destination",id],["destX",8],["destY",8],["facing",2]],
            longExits:[["destination",id],["destX",8],["destY",8],["facing",2],["length",2],["vertical",0]]};
        const grid=element("div");grid.className="grid";form.append(grid);
        if(k==="mapNPCs")form.append(element("p","The NPC appears when its visibility switch is set. For switch 0, an entrance event can run set_bit $300."));
        if(k==="mapTreasure")form.append(element("p","Reward type 0 is empty, 2 starts a battle, 4 gives an item, and 8 gives GP in hundreds. The suggested switch is unused by the current chest records. Reusing a switch links the opened state."));
        for(const [key,value] of [["x",8],["y",8],...groups[k]])inputs[key]=inputBox(grid,key,value,"number");
        let scene;if(["mapEvents","mapNPCs"].includes(k))scene=choices(form,"Run scene",[[-1,"Use event offset"],...state.scenes.map((s,i)=>[i,s.name])]);
        form.append(toolButton("Add object",()=>doAuthor(()=>{
            const values=Object.fromEntries(Object.entries(inputs).map(([key,e])=>[key,e.value]));
            if(k.endsWith("Exits") && Number(values.destination)!==511)integer(+values.destination,0,roomCount(state)-1,"Destination");
            p.object(id,k,objectBytes(k,values),scene && +scene.value>=0?+scene.value:null);
        })));
    }kind.onchange=fields;fields();
    for(const [i,obj] of state.objects.entries())if(obj.map===id){
        const bytes=fromHex(obj.data),npc=obj.kind==="mapNPCs",x=npc?bytes[4]&127:bytes[0],y=npc?bytes[5]&63:bytes[1];
        const row=element("details");row.append(element("summary",tables[obj.kind].name+" at ("+x+", "+y+")"));
        const raw=inputBox(row,"Record bytes",obj.data);
        row.append(toolButton("Apply record",()=>doAuthor(()=>p.object(id,obj.kind,fromHex(raw.value.replace(/\s/g,"")),obj.scene,i))),
            toolButton("Remove added object",()=>doAuthor(()=>p.change("Remove object",s=>s.objects.splice(i,1)))));panel.append(row);
    }
}
function scenePanel(panel,map){
    const p=mapProject(session),s=p.state;
    panel.append(element("h1","Field cutscenes"),element("p",selectedRoomName(session,map)+" · "+hex(map,3)));
    if(map<3){panel.append(element("p","Choose a field map for an entrance event."));return;}
    const entries=[["entrance","Entrance event"]],offsets={entrance:map<431?readLE(session.original,0x11fa00+3*map,3):EMPTY_SCENE};
    for(const kind of ["mapEvents","mapNPCs"])stockObjectRows(session,map,kind).forEach((rec,i)=>{
        const key=[kind,map,i].join("/"),npc=kind==="mapNPCs";
        if(npc && !(rec[7]&192) && (rec[4]&128))return;
        entries.push([key,(npc?"NPC ":"Tile trigger ")+i+" · ("+(npc?rec[4]&127:rec[0])+", "+(npc?rec[5]&63:rec[1])+")"]);
        offsets[key]=npc?readLE(rec,0,3)&0x3ffff:readLE(rec,2,3);
    });
    const target=choices(panel,"Run when",entries);
    const source=choices(panel,"Scene",[[-1,"New scene"],...s.scenes.map((sc,i)=>[i,sc.name])]);
    const name=inputBox(panel,"Scene name",""),area=editorArea(panel,"Field event source","");
    function sourceText(){
        const sc=s.scenes[+source.value];name.value=sc?.name??("Scene "+hex(map,3));
        area.value=sc?.source??("call "+hex(offsets[target.value],6)+"\nreturn");
    }
    function loadTarget(){
        const idx=target.value==="entrance"?s.startup[map]:s.bindings?.[target.value];
        source.value=String(idx??-1);sourceText();
    }
    loadTarget();
    const draft=trackSource(area,"field event",{
        read:()=>({src:source.value,target:target.value,name:name.value}),
        restore:r=>{source.value=r.src;target.value=r.target;name.value=r.name;}
    });
    // Keep the draft visible until applied or explicitly discarded.
    function selectNew(fn,e,key){
        const pending=authorDrafts.get("fieldScenes/"+map);
        if(pending && !confirm("Discard the uncommitted field event draft?")){e.value=pending[key];return;}
        draft.clear();fn();
    }
    source.onchange=()=>selectNew(sourceText,source,"src");
    target.onchange=()=>selectNew(loadTarget,target,"target");name.oninput=draft.changed;
    const save=bind=>{
        const index=+source.value<0?s.scenes.length:+source.value;
        if(!name.value.trim())throw Error("Enter a scene name.");
        p.change("Save field cutscene",next=>{
            next.scenes[index]={name:name.value.trim(),source:area.value};
            if(bind){
                if(target.value==="entrance")next.startup[map]=index;
                else (next.bindings??={})[target.value]=index;
            }
        });draft.clear();
    };
    panel.append(toolButton("Read original event",()=>{area.value=existingSceneSource(session.original,offsets[target.value]);draft.changed();}),
        toolButton("Save scene",()=>doAuthor(()=>save(false))),
        toolButton("Save and bind scene",()=>doAuthor(()=>save(true))),
        toolButton("Discard draft",draft.discard),
        toolButton("Restore original binding",()=>doAuthor(()=>{
            p.change("Restore event binding",next=>{if(target.value==="entrance")delete next.startup[map];else delete next.bindings?.[target.value];});draft.clear();
        })));
    const help=element("details");help.append(element("summary","Field command reference"),
        element("pre","dialogue ID\ngive_item ID\ngive_gp AMOUNT\nset_bit BIT\nclear_bit BIT\ncall LABEL_OR_OFFSET\nif_set BIT LABEL_OR_OFFSET\nif_clear BIT LABEL_OR_OFFSET\nlabel:\nreturn\nend\nbytes BYTE ..."),
        element("p","Numbers are decimal or $hex. A call offset is relative to SNES $CA0000. The native commands below take their encoded operand bytes in order."),
        element("pre",Object.entries(FIELD_OPS).map(([op,[key,,label]])=>key+"_"+Number(op).toString(16).padStart(2,"0")+"   "+label).join("\n")));panel.append(help);
}
function battleEventPanel(panel,id){
    const p=mapProject(session),native=battleList(session.original,id);
    panel.append(element("h1",BATTLE_NAMES[id]),element("p","Battle event "+hex(id)+". Character and monster animation addresses refer to their existing $D0 animation scripts."));
    const area=editorArea(panel,"Battle event program",p.state.battle[id]??printBattle(native));
    const draft=trackSource(area,"battle event");
    panel.append(toolButton("Apply battle event",()=>doAuthor(()=>{p.change("Battle event",s=>{
        const program=assembleBattle(area.value);
        if(sameBytes(program,native))delete s.battle[id];else s.battle[id]=area.value;
    });draft.clear();})),toolButton("Discard draft",draft.discard),element("details"));
    const help=panel.children[panel.children.length-1];help.append(element("summary","Battle commands and operand counts"),
        element("pre",BATTLE_OPS.map(([name,n])=>name+"   "+n).join("\n")+"\nend   0"));
}
const TILE_FLAGS={3:"Top sprite priority",4:"Bottom sprite priority",5:"Door",6:"Stairs up/right",7:"Stairs up/left",8:"Pass right",9:"Pass left",10:"Pass down",11:"Pass up",14:"Ladder",15:"Passable by NPCs"};
function collisionPanel(panel,id){
    panel.append(element("h1","Field tile collision"),element("p","Set "+id+" · shared by every field map using this property set."));
    const tile=inputBox(panel,"Tile ID",0,"number"),form=element("div");panel.append(form);
    function load(){
        form.replaceChildren();try{
            const idx=integer(+tile.value,0,255,"Tile"),raw=tileProperties(session,id),word=raw[idx]|raw[256+idx]<<8;
            const bits=Array.from({length:8},(_,i)=>[i,["None","Upstairs","Downstairs","Both levels","Bridge"][i]??String(i)]);
            const level=choices(form,"Z level",bits);level.value=String(word&7);
            const checks={};for(const [bit,label] of Object.entries(TILE_FLAGS)){const e=element("input");e.type="checkbox";e.checked=Boolean(word&(1<<bit));labeled(form,label,e);checks[bit]=e;}
            const apply=w=>doAuthor(()=>setTileProperty(session,id,idx,w),false);
            form.append(toolButton("Apply tile rules",()=>{let n=(word&0x3000)|Number(level.value);for(const [bit,e] of Object.entries(checks))if(e.checked)n|=1<<bit;apply(n);load();}),
                toolButton("Impassable",()=>{apply(65527);load();}),toolButton("Through tile",()=>{apply(7);load();}));
        }catch(e){message(e.message,true);}
    }tile.onchange=load;load();
}
const graphicDrafts=new Map(),graphicViews=new Map();
function graphicsPanel(panel,kindID){
    const kind=["monster","sprite","tiles","layer3","world"][kindID];
    const titles=["Monster battle sprite","Field sprite sheet","Field tileset graphics","Layer 3 field graphics","World tileset graphics"];
    panel.append(element("h1",titles[kindID]));
    const view=graphicViews.get(kindID)??{id:0,pal:0,sub:0,mode:"exact"};
    const id=inputBox(panel,"Graphics ID",view.id,"number"),pal=inputBox(panel,"Palette",view.pal,"number"),sub=inputBox(panel,"Subpalette",view.sub,"number");
    const mode=choices(panel,"PNG colors",[["exact","Exact game colors"],["nearest","Nearest game colors"],["generate","Generate shared palette"],["index","Index grayscale"]]);
    mode.id="graphic-mode";mode.value=view.mode;
    const result=element("section");panel.append(element("p","Nearest game colors keeps the current palette. Generate shared palette fits the PNG to SNES colors and preserves inks used outside the selection on this sheet."),result);
    pal.disabled=["monster","world"].includes(kind);sub.disabled=!["tiles","layer3","world"].includes(kind);
    if(kind==="world")panel.append(element("p","Graphics IDs 0, 1 and 2 select Balance, Ruin and the Serpent Trench. The sheet uses the selected subpalette. The map painter shows each tile with its in-game palette."));
    let generation=0;
    function refresh(){
        const serial=++generation;result.replaceChildren();
        try{
            const target={kindID,id:id.valueAsNumber??Number(id.value),pal:Number(pal.value),sub:Number(sub.value),mode:mode.value};
            const key=[kindID,target.id,target.pal,target.sub].join("/");
            const draft=graphicDrafts.get(key);
            if(draft)draft.target.mode=target.mode;
            graphicViews.set(kindID,target);
            const args=[session,kind,target.id,target.pal,target.sub],sheet=graphicSheet(...args);
            const indexed=mode.value==="index";
            const canvas=element("canvas");canvas.width=sheet.w;canvas.height=sheet.h;canvas.className="art-preview";
            function draw(data){
                canvas.getContext("2d").putImageData(new ImageData(sheetRGBA(data,indexed),sheet.w,sheet.h),0,0);
            }
            draw(sheet);
            const file=element("input");file.type="file";file.accept="image/png";file.setAttribute("aria-label","Import PNG");file.id="graphic-png";
            result.append(element("p",sheet.w+" × "+sheet.h+" · "+sheet.bpp+" bpp"),toolButton("Export PNG",()=>{
                const clean=element("canvas");clean.width=sheet.w;clean.height=sheet.h;
                clean.getContext("2d").putImageData(new ImageData(sheetRGBA(sheet,indexed),sheet.w,sheet.h),0,0);
                const a=element("a");a.href=clean.toDataURL("image/png");a.download=kind+"-"+id.value+".png";a.click();
            }));
            labeled(result,"Import PNG",file);
            let upload=0;
            file.onchange=async()=>{
                const f=file.files[0];if(!f)return;
                const version=++upload,url=URL.createObjectURL(f);
                function current(){return args[0]===session && serial===generation && upload===version && result.isConnected!==false;}
                try{
                    if(byteString(new Uint8Array(await f.slice(0,8).arrayBuffer()))!=="89504e470d0a1a0a")throw Error("Choose a PNG image.");
                    const img=new Image();img.src=url;await img.decode();
                    if(!current())return;
                    graphicDrafts.set(key,{target:{...target},image:img,name:f.name,rect:{sx:0,sy:0,dx:0,dy:0,w:Math.min(sheet.w,img.naturalWidth),h:Math.min(sheet.h,img.naturalHeight)}});
                    refresh();
                }catch(e){if(current())message(e.message,true);}finally{URL.revokeObjectURL(url);}
            };
            if(!draft){result.append(canvas);return;}
            const img=draft.image,sw=img.naturalWidth,sh=img.naturalHeight,rect=draft.rect;
            const coords=element("div");coords.className="graphic-coordinates";
            const fields={};
            for(const [key,label] of [["sx","Source X"],["sy","Source Y"],["w","Width"],["h","Height"],["dx","Destination X"],["dy","Destination Y"]]){
                const inp=inputBox(coords,label,rect[key],"number");inp.min=key==="w"||key==="h"?1:0;inp.step=1;
                inp.id="graphic-"+key;fields[key]=inp;
            }
            const pair=element("div");pair.className="graphic-pair";
            const source=element("canvas"),scale=Math.min(1,512/Math.max(sw,sh));
            source.width=Math.max(1,Math.round(sw*scale));source.height=Math.max(1,Math.round(sh*scale));
            source.className="art-preview";source.setAttribute("aria-label","Select PNG source rectangle");
            canvas.setAttribute("aria-label","Place selection on destination");
            for(const [art,caption] of [[source,"Source · "+draft.name],[canvas,"Destination · preview"]]){
                const fig=element("figure");fig.append(element("figcaption",caption),art);pair.append(fig);
            }
            const status=element("p");status.id="graphic-result";status.setAttribute("role","status");
            const swatches=element("div");swatches.className="graphic-swatches";
            const apply=toolButton("Apply import",()=>{
                try{
                    if(!plan)throw Error("Choose a valid region.");
                    applyGraphicImport(...args,plan);graphicDrafts.delete(key);buttons();refresh();message("PNG imported.");
                }catch(e){message(e.message,true);}
            });apply.id="graphic-apply";
            const discard=toolButton("Discard preview",()=>{graphicDrafts.delete(key);refresh();message("PNG preview discarded.");});
            result.append(element("p","Drag a rectangle on the source and click its destination, or enter pixel coordinates."),coords,pair,status,swatches,apply,discard);
            let plan;
            function outline(ctx,x,y,w,h){
                ctx.strokeStyle="#151515";ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
                ctx.strokeStyle="#fff";ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
            }
            function preview(){
                const ctx=source.getContext("2d");ctx.clearRect(0,0,source.width,source.height);
                ctx.drawImage(img,0,0,source.width,source.height);
                for(const name of Object.keys(fields))rect[name]=fields[name].value===""?NaN:Number(fields[name].value);
                plan=null;apply.disabled=true;swatches.replaceChildren();draw(sheet);
                try{
                    const {sx,sy,dx,dy,w,h}=rect;
                    integer(w,1,Math.min(sw,sheet.w),"Width");integer(h,1,Math.min(sh,sheet.h),"Height");
                    integer(sx,0,sw-w,"Source X");integer(sy,0,sh-h,"Source Y");
                    integer(dx,0,sheet.w-w,"Destination X");integer(dy,0,sheet.h-h,"Destination Y");
                    outline(ctx,sx*source.width/sw,sy*source.height/sh,w*source.width/sw,h*source.height/sh);
                    const tmp=element("canvas");tmp.width=w;tmp.height=h;const crop=tmp.getContext("2d");
                    crop.drawImage(img,sx,sy,w,h,0,0,w,h);
                    plan=planGraphicImport(sheet,{width:w,height:h,pixels:crop.getImageData(0,0,w,h).data},{...rect,sx:0,sy:0},mode.value);
                    draw({...sheet,colors:plan.words.map(colorRGB),indices:plan.indices});
                    outline(canvas.getContext("2d"),dx,dy,w,h);
                    status.textContent=w+" × "+h+" at ("+dx+", "+dy+") · "+plan.changedPixels+" changed pixel indices · "+plan.changed.length+" changed palette entries"+
                        (indexed?"":" · "+plan.approximated+" pixels mapped to a different SNES color")+".";
                    if(plan.changed.length){
                        status.textContent+=" Other graphics that use these palette entries will also change color.";
                        for(const i of plan.changed){
                            const item=element("span","Ink "+i+" ");
                            for(const [j,rgb] of [sheet.colors[i],colorRGB(plan.words[i])].entries()){
                                if(j)item.append(element("span"," → "));
                                const chip=element("span");chip.className="color-chip";
                                chip.style.backgroundColor="rgb("+rgb.join(",")+")";
                                chip.title=(j?"After ":"Before ")+rgb.join(", ");item.append(chip);
                            }
                            swatches.append(item);
                        }
                    }
                    apply.disabled=false;
                }catch(e){status.textContent=e.message;}
            }
            Object.values(fields).forEach(inp=>inp.oninput=preview);
            function point(e,art,w,h){
                const b=art.getBoundingClientRect();
                return [Math.max(0,Math.min(w-1,Math.floor((e.clientX-b.left)*w/b.width))),
                    Math.max(0,Math.min(h-1,Math.floor((e.clientY-b.top)*h/b.height)))];
            }
            let anchor=null;
            function selectRegion(e){
                if(!anchor || anchor.id!==e.pointerId)return;
                const [x,y]=point(e,source,sw,sh);
                fields.sx.value=Math.min(x,anchor.x);fields.sy.value=Math.min(y,anchor.y);
                fields.w.value=Math.abs(anchor.x-x)+1;fields.h.value=Math.abs(anchor.y-y)+1;preview();
            }
            source.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const [x,y]=point(e,source,sw,sh);anchor={x,y,id:e.pointerId};source.setPointerCapture(e.pointerId);selectRegion(e);};
            source.onpointermove=selectRegion;source.onpointerup=e=>{selectRegion(e);anchor=null;};
            source.onpointercancel=source.onlostpointercapture=()=>{anchor=null;};
            canvas.onclick=e=>{const [x,y]=point(e,canvas,sheet.w,sheet.h);fields.dx.value=x;fields.dy.value=y;preview();};
            preview();
        }catch(e){result.append(element("p",e.message));}
    }
    id.onchange=pal.onchange=sub.onchange=mode.onchange=refresh;refresh();
}
function framePanel(panel,id){
    const {at,data}=animationFrame(session,id),lines=[];
    for(let i=0;i<data.length;i+=2)lines.push([data[i]>>4,data[i]&15,data[i+1]&63,(data[i+1]>>6)&1,data[i+1]>>7].join(" "));
    panel.append(element("h1","Animation frame "+hex(id,3)),element("p","Each tile slot uses X, Y, tile ID, horizontal flip and vertical flip. Shared frame artwork changes for all users. SNES "+hex(0xc00000+at,6)+"."));
    const area=editorArea(panel,"Animation frame tile slots",lines.join("\n"));const draft=trackSource(area,"animation frame");
    const grid=element("canvas");grid.width=grid.height=256;grid.setAttribute("aria-label","Frame tile positions");
    const paint=()=>{
        const ctx=grid.getContext("2d");ctx.fillStyle="#171d24";ctx.fillRect(0,0,256,256);
        for(const {words} of sourceLines(area.value)){
            const [x,y,tile]=words.map(Number);
            if(![x,y,tile].every(Number.isInteger))continue;
            ctx.fillStyle="hsl("+((tile*43)%360)+" 50% 57%)";ctx.fillRect(x*16+1,y*16+1,14,14);
        }
    };
    grid.onclick=e=>{
        const rect=grid.getBoundingClientRect(),x=Math.floor((e.clientX-rect.left)*16/rect.width),y=Math.floor((e.clientY-rect.top)*16/rect.height);
        let at=0;for(const line of area.value.split("\n")){
            const [cx,cy]=line.trim().split(/\s+/).map(Number);
            if(cx===x && cy===y){area.focus();area.setSelectionRange(at,at+line.length);break;}at+=line.length+1;
        }
    };
    area.oninput=()=>{draft.changed();paint();};paint();panel.append(grid);
    panel.append(element("p","The grid shows tile positions. Click an occupied square to select its source line."));
    panel.append(toolButton("Apply frame",()=>doAuthor(()=>{saveFrame(session,id,area.value);draft.clear();})),toolButton("Discard draft",draft.discard));
}
function showAuthor(panel,mode,id){
    try{({metatiles:metatilePanel,rooms:roomPanel,fieldScenes:scenePanel,battleEvents:battleEventPanel,collision:collisionPanel,graphicsSheets:graphicsPanel,frames:framePanel})[mode](panel,id);}
    catch(e){panel.append(element("p",e.message));}
}
// The game reads BG1/BG2 metatile definitions through a bank-and-offset directory.
assetKinds.metatiles={table:0x1fba00,stride:3,base:0x1e0000,pool:[0x372200,0x37ff00],guard:"Field metatiles"};
WORK_LAYOUT.metatiles=METATILE_SLOTS;
WORK_LAYOUT.guards["Field metatiles"]={"bf00badf":[0x27ef,0x2840],"bf02badf":[0x27fb,0x284c]};
const METATILE_FORMAT=["interlace(4,16,2)","interlace(1,2,4)","interlace(1,8,256)","ff6-lzss"];
function metatileWords(s,set){
    const raw=ROMAssembly.decode(sessionAssets(s).packed("metatiles",set),METATILE_FORMAT)[0];
    if(raw.byteLength!==2048)throw Error("Invalid field tileset length.");return raw;
}
function quadrantIndex(tile,i){return 2*((tile>>4)*64+(tile&15)*2+(i>>1)*32+(i&1));}
function editMetatile(s,set,tile,words){
    integer(tile,0,255,"Metatile");
    if(words.length!==4)throw Error("Choose four quadrants.");
    const raw=metatileWords(s,set),copy=raw.slice();
    words.forEach((word,i)=>writeLE(copy,quadrantIndex(tile,i),integer(word,0,65535,"Tile word"),2));
    if(sameBytes(raw,copy))return;
    const packed=ROMAssembly.encode(copy,METATILE_FORMAT)[0];
    if(!sameBytes(ROMAssembly.decode(packed,METATILE_FORMAT)[0],copy))throw Error("Metatile compression failed.");
    sessionAssets(s).set("metatiles",set,packed);
}
function metatilePanel(panel,id){
    panel.append(element("h1","Field tileset "+hex(id)),element("p","A 16 × 16 map tile uses four 8 × 8 graphics. This definition is shared by maps using the tileset."));
    const tile=inputBox(panel,"Map tile",0,"number"),form=element("section");panel.append(form);
    function load(){
        form.replaceChildren();try{
            const t=integer(+tile.value,0,255,"Map tile"),raw=metatileWords(session,id);
            const inputs=["Upper left","Upper right","Lower left","Lower right"].map((label,i)=>{
                const word=readLE(raw,quadrantIndex(t,i),2),row=element("fieldset");
                row.append(element("legend",label));form.append(row);
                const art=inputBox(row,"Graphic tile",word&1023,"number"),pal=inputBox(row,"Subpalette",(word>>10)&7,"number");
                const check=(name,mask)=>{const e=element("input");e.type="checkbox";e.checked=Boolean(word&mask);labeled(row,name,e);return e;};
                const front=check("Priority",8192),h=check("Flip horizontally",16384),v=check("Flip vertically",32768);
                return ()=>integer(+art.value,0,1023,"Graphic tile")|(integer(+pal.value,0,7,"Palette")<<10)|(front.checked?8192:0)|(h.checked?16384:0)|(v.checked?32768:0);
            });
            form.append(toolButton("Apply metatile",()=>doAuthor(()=>editMetatile(session,id,t,inputs.map(read=>read())),false)));
        }catch(e){message(e.message,true);}
    }tile.onchange=load;load();
}
assetKinds.worldArt={sites:[0x2eb212,0x2eb21e,0x2eb22a],stride:3,base:-0xc00000,pool:[0x38b100,0x38ff00],guard:"World artwork"};
WORK_LAYOUT.worldArt=[[0x2f114f,0x2101],[0x2f4a46,0x2010],[0x2fb631,0xff3]];
// The first three entries always point to the same game data. Layout and graphics
// have separate editable pointers; each store validates those against its own catalogue.
WORK_LAYOUT.guards["World artwork"]={"90b2ee90b2ee90b2ee95c2ee":[0x2eb200]};
WORK_LAYOUT.guards["World tiles"]=WORK_LAYOUT.guards["World artwork"];
