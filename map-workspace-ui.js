// Map selection, tile painting and event authoring share one view and history. GPL-3.0.
"use strict";
function mapCanvas(pixels,w,h){
    const canvas=element("canvas");canvas.width=w;canvas.height=h;
    if(pixels)canvas.getContext("2d").putImageData(new ImageData(pixels,w,h),0,0);
    return canvas;
}
function mapEventPanel(panel,s,map,key,o,view,refresh){
    const event=targetScene(s,map,key,o),state=mapProject(s).state;
    const draftKey="mapEditor/"+map+"/"+key, draft=authorDrafts.get(draftKey);
    const source=element("textarea"),commands=element("select"),linked=element("div"),tools=element("div");
    source.className="ai-source";source.setAttribute("aria-label","Map event source");source.id="map-event-source";
    source.value=draft?.text??event.source;source.spellcheck=false;
    const recordDraft=()=>{
        if(source.value===event.source)authorDrafts.delete(draftKey);
        else authorDrafts.set(draftKey,{mode:"mapEditor",id:map,target:key,text:source.value,title:"map event"});
    };
    const caption=key==="entrance"?"Entrance event":mapKinds[o.kind]+" event";
    panel.append(element("h2",caption+(event.scene!=null?" · "+state.scenes[event.scene].name:" · "+hex(0xca0000+event.offset,6))));
    commands.id="map-commands";commands.size=5;commands.setAttribute("aria-label","Event commands");commands.className="map-commands";
    function pickLine(){
        linked.replaceChildren();const ln=Number(commands.value);
        if(commands.selectedIndex<0)return;
        const line=source.value.split("\n")[ln],d=mapDialogue(line);
        if(!d){
            const call=/^\s*call\s+(\$[\da-f]+|0x[\da-f]+|\d+)\s*$/i.exec(line);
            if(call){const off=numberToken(call[1],0x35ffff);if(off+0xa0000<s.original.length)nativeFieldInspector(linked,s,off);}
            return;
        }
        linked.append(element("h2","Dialogue "+hex(d.id,3)));
        if(d.key){linked.append(element("p","Editing this text changes every event that displays this dialogue ID."));dialoguePanel(linked,d.key,d.index,()=>{
                commands.options[commands.selectedIndex].textContent="Display dialogue "+hex(d.id,3)+" · "+s.dialogue.searchText(d.key,d.index).slice(0,90);
            });}
        else linked.append(element("p","This ID is outside the editable Regular dialogue tables."));
    }
    function list(preferred){
        const rows=source.value.split("\n"),dialog=s.dialogue ||= new FieldDialogue(s);
        commands.replaceChildren();
        rows.forEach((line,i)=>{
            if(!line.trim() || line.trim().startsWith("#"))return;
            const d=mapDialogue(line),text=d?.key?dialog.searchText(d.key,d.index):"";
            const label=d?"Display dialogue "+hex(d.id,3)+(text?" · "+text.slice(0,90):""):line.trim();
            commands.add(new Option(label,i));
        });
        if(preferred!=null)commands.value=String(preferred);
        if(commands.selectedIndex<0 && commands.options.length)commands.selectedIndex=0;
        pickLine();
    }
    commands.onchange=pickLine;source.oninput=()=>{recordDraft();list(Number(commands.value));};
    const edit=element("details");edit.append(element("summary","Event source"),source);
    tools.className="asset-controls";
    const op=choices(tools,"Command",[["dialogue","Display dialogue"],["give_item","Give item"],["give_gp","Give GP"],["set_bit","Set event bit"],["clear_bit","Clear event bit"],["call","Call existing event"],["return","Return"]]);
    const operand=inputBox(tools,"Operand","$0000");
    function changeList(action){
        const lines=source.value.split("\n");let i=commands.selectedIndex<0?lines.length:Number(commands.value);
        if(action==="insert"){
            const command=op.value+(op.value==="return"?"":" "+operand.value.trim());
            // Validate the new instruction before changing the draft.
            assembleField(command+(op.value==="return"?"":"\nreturn"),0x3d5000);
            lines.splice(i,0,command);
        }else if(i>=lines.length)return;
        else if(action==="remove"){lines.splice(i,1);i=Math.min(i,lines.length-1);}
        else {const j=i+action;if(j<0 || j>=lines.length)return;[lines[i],lines[j]]=[lines[j],lines[i]];i=j;}
        source.value=lines.join("\n");recordDraft();list(i);
    }
    for(const [label,action] of [["Insert before","insert"],["Move up",-1],["Move down",1],["Remove command","remove"]])
        tools.append(toolButton(label,()=>{try{changeList(action);}catch(e){message(e.message,true);}}));
    const apply=toolButton("Apply event to this object",()=>{
        try{
            if(source.value===event.source)return;
            bindMapScene(s,map,key,o,null,source.value,(key==="entrance"?"Entrance":mapKinds[o.kind])+" · "+selectedRoomName(s,map));
            authorDrafts.delete(draftKey);refresh();message("Event applied.");
        }catch(e){message(e.message,true);}
    });
    apply.textContent=key==="entrance"?"Apply entrance event":"Apply event to this object";apply.id="map-apply-event";
    panel.append(commands,linked,tools,edit,apply,toolButton("Discard event draft",()=>{authorDrafts.delete(draftKey);source.value=event.source;list();}));
    if(state.scenes.length){
        const bind=element("div");bind.className="asset-controls";
        const sel=choices(bind,"Existing scene",[[-1,"Original event"],...state.scenes.map((sc,i)=>[i,sc.name])]);sel.value=String(event.scene??-1);
        bind.append(toolButton("Use selected scene",()=>{
            try{if(authorDrafts.has(draftKey))throw Error("Apply or discard the event draft first.");
                bindMapScene(s,map,key,o,+sel.value<0?null:+sel.value,null);refresh();}
            catch(e){message(e.message,true);}
        }));panel.append(bind);
    }
    list();
}
function mapWorkspacePanel(panel,map){
    const s=session,rom=projectMapROM(s,map),art=loadMapArt(s,map,rom);
    const firstOpen=mapView.map!==map || !mapView.workspace;
    if(firstOpen)mapView={workspace:true,map,tool:"select",zoom:1,brush:0,bw:1,bh:1,visible:7,markers:true,cx:0,cy:0,left:0,top:0};
    const v=mapView,objects=mapObjects(s,map,rom);let active=null;
    const layers=art.layers,layer=()=>layers.find(l=>l.l===v.layer);
    if(!layer())v.layer=layers[0]?.l;
    const allowed=Object.keys(mapKinds).filter(k=>map>=3 || k==="shortExits" || k==="mapEvents");
    const selectedObject=()=>objects.find(o=>o.key===v.target);
    if(firstOpen && map===20 && objects.some(o=>o.key==="mapNPCs/20/4"))v.target="mapNPCs/20/4";
    if(v.target!=="entrance" && !selectedObject())v.target="";
    panel.append(element("h1",selectedRoomName(s,map)));
    const bar=element("div");bar.className="asset-controls map-bar";
    const mode=choices(bar,"Tool",[["select","Select / move"],...(layers.length?[["paint","Paint tiles"]]:[]),...allowed.map(k=>[k,"Place "+mapKinds[k].toLowerCase()])]);mode.id="map-tool";mode.value=v.tool;
    const zoom=choices(bar,"Zoom",[[0.5,"50%"],[1,"100%"],[2,"200%"],[3,"300%"]]);zoom.value=String(v.zoom);
    for(const l of layers){const e=element("input");e.type="checkbox";e.checked=!!(v.visible&(1<<l.l));labeled(bar,map<3?"World":"Layer "+(l.l+1),e);e.onchange=()=>{v.visible=e.checked?v.visible|(1<<l.l):v.visible&~(1<<l.l);cache.clear();render();};}
    const markers=element("input");markers.type="checkbox";markers.checked=v.markers;labeled(bar,"Objects",markers);
    markers.onchange=()=>{v.markers=markers.checked;render();};panel.append(bar);
    const grid=element("div"),left=element("div"),side=element("section"),inspector=element("div"),eventBox=element("section");
    grid.className="unified-map";side.className="map-sidebar";eventBox.className="map-event";
    const viewport=element("div"),stage=element("div"),canvas=mapCanvas(null,1,1),status=element("p");
    viewport.className="map-viewport";stage.className="map-stage";canvas.id="map-canvas";canvas.tabIndex=0;
    canvas.setAttribute("aria-label","Map tile and object canvas");stage.append(canvas);viewport.append(stage);left.append(viewport);
    const controls=element("div");controls.className="asset-controls map-coordinates";
    const cx=inputBox(controls,"X",v.cx,"number"),cy=inputBox(controls,"Y",v.cy,"number");cx.id="map-x";cy.id="map-y";
    const act=toolButton("Use tool here",()=>{try{const [x,y]=readCoords();operate(x,y);}catch(e){message(e.message,true);}});
    act.id="map-use";controls.append(act,toolButton("Center",()=>{try{const [x,y]=readCoords();pointTo(x,y);center(x,y);}catch(e){message(e.message,true);}}));
    left.append(controls,status);
    if(map>=3)left.append(toolButton("Room settings",()=>jumpTo("rooms",map)));
    const brushBox=element("div");
    const picker=choices(side,"Map object",[]);picker.id="map-object";picker.setAttribute("aria-label","Map object");
    picker.add(new Option("Choose on map…",""));if(map>=3)picker.add(new Option("Entrance event","entrance"));
    const label=o=>{const b=objectBounds(o);return mapKinds[o.kind]+" ("+b.x+", "+b.y+")"+(o.index!=null?" · added":"");};
    objects.forEach(o=>picker.add(new Option(label(o),o.key)));picker.value=v.target||"";
    side.append(brushBox,inspector);grid.append(left,side);panel.append(grid,eventBox);
    const cache=new Map(),sprites=new Map(),spritePixels=new Map();
    function readCoords(){return [cx,cy].map((e,i)=>integer(e.value===""?NaN:+e.value,0,(i?art.h:art.w)-1,i?"Y":"X"));}
    function pointTo(x,y){v.cx=x;v.cy=y;cx.value=String(x);cy.value=String(y);}
    function center(x,y){
        const w=viewport.clientWidth||480,h=viewport.clientHeight||320,unit=16*v.zoom;
        v.left=viewport.scrollLeft=Math.max(0,Math.min(art.w*unit-w,(x+.5)*unit-w/2));
        v.top=viewport.scrollTop=Math.max(0,Math.min(art.h*unit-h,(y+.5)*unit-h/2));render();
    }
    function refresh(){detail();buttons();}
    function select(key,go=false){
        v.target=key;picker.value=key;const o=selectedObject();
        if(go && o){const b=objectBounds(o);pointTo(b.x,b.y);center(b.x,b.y);}
        showInspector();render();
    }
    picker.onchange=()=>select(picker.value,true);
    function showInspector(){
        inspector.replaceChildren();eventBox.replaceChildren();
        const o=selectedObject();
        if(!o && v.target!=="entrance"){
            inspector.append(element("p","Select a marker to inspect it. Drag to move it. Click again to cycle objects on the same tile."));
            return;
        }
        if(o){
            inspector.append(element("h2",label(o)));
            const form=element("div");form.className="map-fields";inspector.append(form);
            for(const [key,spec] of Object.entries(tables[o.kind].fields)){
                if(spec.readOnly || spec.hidden || (specialNPC(o) && ["movement","facing"].includes(key)))continue;
                const val=objectField(o,key);
                let ctrl;
                if(spec.domain){
                    const opts=Object.entries(fieldChoices(s,o.kind,o.id,key));
                    if(!opts.some(([id])=>+id===val))opts.push([val,"Existing value "+val]);
                    ctrl=choices(form,spec.name,opts);ctrl.value=String(val);
                }else if(spec.bool){ctrl=element("input");ctrl.type="checkbox";ctrl.checked=!!val;labeled(form,spec.name,ctrl);}
                else if(o.kind==="mapTreasure" && key==="value" && objectField(o,"reward")===4){
                    ctrl=choices(form,"Item",range(256).map(i=>[i,hex(i)+" "+(i===255?"Empty":s.name("items",i))]));ctrl.value=String(val);
                }else ctrl=inputBox(form,spec.name,val,"number");
                ctrl.id="map-prop-"+key;
                ctrl.onchange=()=>{try{applyObjectFields(s,o,{[key]:spec.bool?Number(ctrl.checked):ctrl.value===""?NaN:+ctrl.value});refresh();}
                    catch(e){if(spec.bool)ctrl.checked=!!val;else ctrl.value=String(val);message(e.message,true);}};
            }
            if(o.kind==="mapTreasure" && objectField(o,"reward")===8)inspector.append(element("p","Reward is in hundreds of GP."));
            if(o.kind==="mapNPCs")inspector.append(element("p","The visibility switch controls whether this NPC appears in play. For switch 0, an entrance event can use set_bit $300."));
            if(o.kind.endsWith("Exits")){
                const dest=objectField(o,"dest");
                if(dest<roomCount(mapProject(s).state))inspector.append(toolButton("Open destination",()=>{
                    const x=objectField(o,"destX"),y=objectField(o,"destY");
                    el("search").value="";selected=dest;records();mapView={};detail();
                    const nx=el("map-x"),ny=el("map-y");if(nx && ny){nx.value=x;ny.value=y;el("map-center")?.click();}
                }));
            }
            if(o.index!=null)inspector.append(toolButton("Remove added object",()=>{
                try{
                    if(authorDrafts.size)throw Error("Apply or discard pending event and authoring drafts before removing an object.");
                    if(o.kind==="mapNPCs" && objects.some(other=>other.kind===o.kind && other.index>o.index))throw Error("Remove later NPC slots first to preserve their event IDs.");
                    mapProject(s).change("Remove map object",q=>q.objects.splice(o.index,1));v.target="";refresh();
                }catch(e){message(e.message,true);}
            }));
        }
        if(v.target==="entrance" || (o && objectEvent(o)!=null))mapEventPanel(eventBox,s,map,v.target,o,v,refresh);
    }
    controls.children[controls.children.length-1].id="map-center";
    function brushPanel(){
        brushBox.replaceChildren();
        if(v.tool!=="paint" || !layers.length)return;
        const plane=choices(brushBox,"Paint layer",layers.map(l=>[l.l,map<3?"World":"Layer "+(l.l+1)]));
        plane.value=String(v.layer);plane.onchange=()=>{v.layer=+plane.value;v.visible|=1<<v.layer;refresh();};
        const l=layer(),pal=mapCanvas(l.atlas,256,256);pal.id="map-brush";pal.className="map-brush";pal.tabIndex=0;
        let anchor=null;
        function show(){
            const ctx=pal.getContext("2d");ctx.putImageData(new ImageData(l.atlas,256,256),0,0);
            ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.strokeRect((v.brush&15)*16+1,(v.brush>>4)*16+1,16*v.bw-2,16*v.bh-2);
            status.textContent="Brush "+hex(v.brush)+" · "+v.bw+" × "+v.bh+". Drag across the tileset to select a stamp. Right-click the map to pick a tile.";
        }
        function palettePoint(e){
            const r=pal.getBoundingClientRect();
            return [16*(e.clientX-r.left)/r.width,16*(e.clientY-r.top)/r.height].map(n=>Math.max(0,Math.min(15,Math.floor(n))));
        }
        function stretch(e){
            if(!anchor || e.pointerId!==anchor.id)return;
            const [x,y]=palettePoint(e),[a,b]=anchor.point;
            v.brush=Math.min(x,a)+16*Math.min(y,b);v.bw=1+Math.abs(x-a);v.bh=1+Math.abs(y-b);show();
        }
        pal.onpointerdown=e=>{if(e.button!==0 || anchor)return;e.preventDefault();anchor={id:e.pointerId,point:palettePoint(e)};pal.setPointerCapture(e.pointerId);stretch(e);};
        pal.onpointermove=stretch;pal.onpointerup=e=>{stretch(e);anchor=null;};pal.onlostpointercapture=pal.onpointercancel=()=>{anchor=null;};
        pal.onkeydown=e=>{const delta={ArrowDown:16,ArrowUp:-16,ArrowLeft:-1,ArrowRight:1}[e.key];if(delta){e.preventDefault();v.bw=v.bh=1;v.brush=Math.max(0,Math.min(255,v.brush+delta));show();}};
        brushBox.append(pal);
        const solo=element("input");solo.type="checkbox";solo.checked=Boolean(v.solo);
        labeled(brushBox,"Isolate paint layer",solo);solo.onchange=()=>{v.solo=solo.checked;cache.clear();render();};show();
        if(map>=3 && map<431){
            const shared=[];for(let id=3;id<431;id++)if(id!==map && [0,1,2].some(n=>mapLayerInfo(rom,id,n).layout===l.layout))shared.push(id);
            if(shared.length)brushBox.append(element("p","Layout shared with "+shared.length+" other map"+(shared.length===1?"":"s")+". Painting updates each one."));
        }
    }
    function render(){
        const unit=16*v.zoom;stage.style.width=art.w*unit+"px";stage.style.height=art.h*unit+"px";
        const x0=Math.min(art.w-1,Math.floor((viewport.scrollLeft||0)/unit)),y0=Math.min(art.h-1,Math.floor((viewport.scrollTop||0)/unit));
        const w=Math.min(art.w-x0,Math.ceil((viewport.clientWidth||480)/unit)+1),h=Math.min(art.h-y0,Math.ceil((viewport.clientHeight||320)/unit)+1);
        if(canvas.width!==w*16)canvas.width=w*16;if(canvas.height!==h*16)canvas.height=h*16;
        Object.assign(canvas.style,{left:x0*unit+"px",top:y0*unit+"px",width:w*unit+"px",height:h*unit+"px"});
        canvas.dataset.x=x0;canvas.dataset.y=y0;
        const ctx=canvas.getContext("2d");
        const solo=v.tool==="paint" && v.solo;
        const display=solo?{...art,main:1<<v.layer,sub:0,math:0}:art;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
            const ids=layers.map(l=>(v.visible&(1<<l.l))?(l.bytes[mapLayerCell(l,x+x0,y+y0)]??-1):-1),key=(solo?"solo/"+v.layer+"/":"")+ids.join("/");
            let tile=cache.get(key);
            if(!tile){tile=mapCanvas(composeMapTile(display,ids),16,16);if(cache.size>1536)cache.clear();cache.set(key,tile);}
            ctx.drawImage(tile,x*16,y*16);
        }
        const visibleSprites=[];
        if(v.markers)for(const o of objects){
            const b=objectBounds(o);if(b.x+b.w<x0 || b.x>=x0+w || b.y+b.h<y0 || b.y>=y0+h+1)continue;
            const x=(b.x-x0)*16,y=(b.y-y0)*16;
            if(o.kind==="mapNPCs"){
                if(!sprites.has(o.key)){const rgba=mapNPCPixels(rom,o);spritePixels.set(o.key,rgba);sprites.set(o.key,rgba?mapCanvas(rgba,16,24):null);}
                const sprite=sprites.get(o.key);if(sprite)visibleSprites.push({sprite,x,y,priority:o.raw[7]&48});
            }
            ctx.strokeStyle=mapColors[o.kind];ctx.lineWidth=1;
            ctx.fillStyle=mapColors[o.kind]+"32";ctx.fillRect(x,y,16*b.w,16*b.h);ctx.strokeRect(x+.5,y+.5,16*b.w-1,16*b.h-1);
        }
        const obj=selectedObject();if(v.markers && obj){const b=objectBounds(obj);ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.strokeRect((b.x-x0)*16+1,(b.y-y0)*16+1,b.w*16-2,b.h*16-2);}
        // Leave the characters' artwork and palette visible over the selection markers.
        visibleSprites.sort((a,b)=>a.y-b.y || a.priority-b.priority);
        for(const {sprite,x,y} of visibleSprites)ctx.drawImage(sprite,x,y-16);
        if(active?.move){ctx.strokeStyle="#fff";ctx.strokeRect((v.cx-x0)*16+.5,(v.cy-y0)*16+.5,15,15);}
    }
    function stamp(l,bytes,x,y){
        for(let h=0;h<v.bh && y+h<art.h;h++)for(let w=0;w<v.bw && x+w<art.w;w++){
            const i=mapLayerCell(l,x+w,y+h);if(i>=0)bytes[i]=v.brush+h*16+w;
        }
    }
    function hitsAt(x,y,e){
        const hits=mapHit(objects,x,y);if(!e)return hits;
        const r=canvas.getBoundingClientRect(),px=Math.floor((e.clientX-r.left)*canvas.width/r.width)&15,py=Math.floor((e.clientY-r.top)*canvas.height/r.height)&15;
        for(const o of objects){
            const pixels=spritePixels.get(o.key);if(!pixels)continue;
            const b=objectBounds(o);
            if(b.x===x && b.y===y+1 && pixels[(py*16+px)*4+3])hits.push(o);
        }
        return hits;
    }
    function operate(x,y,e){
        pointTo(x,y);
        if(v.tool==="select"){
            const hits=v.markers?hitsAt(x,y,e):[],i=hits.findIndex(o=>o.key===v.target);
            select(hits.length?hits[(i+1)%hits.length].key:"");return;
        }
        if(v.tool==="paint"){
            const l=layer(),i=mapLayerCell(l,x,y);if(i<0)throw Error("This cell is outside the stored layout.");
            if(!(v.visible&(1<<l.l)))throw Error("Show the selected paint layer first.");
            const copy=l.bytes.slice();stamp(l,copy,x,y);commitPaint(l,copy);refresh();return;
        }
        v.target=placeMapObject(s,map,v.tool,x,y);v.tool="select";v.markers=true;refresh();
    }
    function commitPaint(l,bytes){
        if(map>=431)mapProject(s).setLayer(map,l.l,bytes);
        else saveLayer(sessionAssets(s),l.layout,bytes,map<3?"worlds":"layouts");
    }
    function pos(e){
        const r=canvas.getBoundingClientRect();
        return [Math.floor((e.clientX-r.left)*canvas.width/r.width/16)+Number(canvas.dataset.x),
            Math.floor((e.clientY-r.top)*canvas.height/r.height/16)+Number(canvas.dataset.y)];
    }
    function valid(x,y){return x>=0 && y>=0 && x<art.w && y<art.h;}
    function stroke(x,y){
        const prev=active.last??[x,y],n=Math.max(1,Math.abs(x-prev[0]),Math.abs(y-prev[1]));
        for(let i=1;i<=n;i++){const a=Math.round(prev[0]+(x-prev[0])*i/n),b=Math.round(prev[1]+(y-prev[1])*i/n);const l=layer();stamp(l,l.bytes,a,b);}
        active.last=[x,y];pointTo(x,y);render();
    }
    canvas.oncontextmenu=e=>e.preventDefault();
    canvas.onpointerdown=e=>{
        if(active)return;const [x,y]=pos(e);if(!valid(x,y))return;
        try{
            if(v.tool==="paint" && (e.button===2 || e.shiftKey)){
                const l=layer(),i=mapLayerCell(l,x,y);if(i>=0){v.bw=v.bh=1;v.brush=l.bytes[i];brushPanel();}return;
            }
            if(e.button!==0)return;e.preventDefault();
            if(v.tool==="paint"){
                const l=layer();if(!(v.visible&(1<<l.l)))throw Error("Show the selected paint layer first.");
                active={id:e.pointerId,old:l.bytes.slice()};canvas.setPointerCapture(e.pointerId);stroke(x,y);
            }else if(v.tool==="select"){
                const hits=v.markers?hitsAt(x,y,e):[],o=hits.find(row=>row.key===v.target)??hits[0];
                active={id:e.pointerId,start:[x,y],o};canvas.setPointerCapture(e.pointerId);pointTo(x,y);
            }else operate(x,y);
        }catch(err){message(err.message,true);}
    };
    canvas.onpointermove=e=>{
        if(!active || active.id!==e.pointerId)return;
        const [x,y]=pos(e);if(!valid(x,y))return;
        if(active.old)stroke(x,y);
        else if(active.o){active.move=x!==active.start[0] || y!==active.start[1];pointTo(x,y);render();}
    };
    function finish(e,cancel){
        if(!active || active.id!==e.pointerId)return;
        const drag=active;active=null;
        try{
            if(drag.old){
                if(cancel)layer().bytes.set(drag.old);
                else{const [x,y]=pos(e);if(valid(x,y)){active=drag;stroke(x,y);active=null;}commitPaint(layer(),layer().bytes);buttons();}
            }else if(!cancel){
                const [x,y]=pos(e);if(!valid(x,y))return;
                if(drag.o && (x!==drag.start[0] || y!==drag.start[1])){
                    const b=objectBounds(drag.o);applyObjectFields(s,drag.o,{x:b.x+x-drag.start[0],y:b.y+y-drag.start[1]});v.target=drag.o.key;refresh();return;
                }
                operate(x,y,e);
            }
        }catch(err){if(drag.old)layer().bytes.set(drag.old);message(err.message,true);}
        render();
    }
    canvas.onpointerup=e=>finish(e,false);canvas.onlostpointercapture=canvas.onpointercancel=e=>finish(e,true);
    mode.onchange=()=>{v.tool=mode.value;if(v.tool!=="select"){v.target="";picker.value="";}status.textContent=v.tool==="select"?"":v.tool==="paint"?"":"Click a map tile to place the "+mapKinds[v.tool].toLowerCase()+".";brushPanel();showInspector();render();};
    zoom.onchange=()=>{const ratio=+zoom.value/v.zoom,x=viewport.scrollLeft||0,y=viewport.scrollTop||0;v.zoom=+zoom.value;render();viewport.scrollLeft=x*ratio;viewport.scrollTop=y*ratio;render();};
    viewport.onscroll=()=>{v.left=viewport.scrollLeft;v.top=viewport.scrollTop;render();};
    if(!layers.length){art.w=art.h=64;}
    if(!layers.length)status.textContent="This map has no stored tile layout.";
    brushPanel();showInspector();render();
    if(firstOpen && layers.length){
        const entry=selectedObject()??objects.find(o=>{const b=objectBounds(o);return b.x>0 && b.y>0 && b.x<art.w && b.y<art.h;});
        const b=entry?objectBounds(entry):{x:Math.floor(art.w/2),y:Math.floor(art.h/2)};
        pointTo(b.x,b.y);center(b.x,b.y);
    }else{viewport.scrollLeft=v.left;viewport.scrollTop=v.top;render();}
    if(typeof ResizeObserver!=="undefined"){
        // Observe only the current viewport, including resizes of its containing panel.
        mapWorkspacePanel.observer?.disconnect();const observer=new ResizeObserver(()=>{if(!viewport.isConnected){observer.disconnect();return;}render();});
        mapWorkspacePanel.observer=observer;observer.observe(viewport);
    }
}
