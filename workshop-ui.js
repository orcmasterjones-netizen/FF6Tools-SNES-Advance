// Editing panels for monster scripts and field map layers. GPL-3.0.
"use strict";
function toolButton(label, action) {
    const b=element("button",label);b.type="button";b.onclick=action;return b;
}
function addWorkshop(panel, key, id) {
    if(key!=="monsters" && key!=="maps")return;
    const scripts=key==="monsters", box=element("section");
    panel.append(box);
    function show() {
        box.replaceChildren();
        try {
            if(scripts)scriptPanel(box,id);
            else fieldPanel(box,id);
        }catch(e){box.append(element("p",e.message));}
    }
    if(workshopMode)show();
    else box.append(toolButton(scripts?"Edit monster script":"Paint map tiles",()=>{
        workshopMode=scripts?"monsterScripts":"mapTiles";
        for(const b of el("tabs").children)b.classList.toggle("active",b.dataset.key===workshopMode);
        detail();
    }));
}
function scriptPanel(box,id) {
    const assets=sessionAssets(session);
    const original=assets.packed("scripts",id);
    const area=element("textarea"),result=element("p"),attack=element("select");
    area.id="ai-source";area.className="ai-source";area.setAttribute("aria-label","Monster battle script");area.spellcheck=false;
    const applied=printScript(original,session.original);
    area.value=scriptDrafts.get(id)??applied;
    area.oninput=()=>{if(area.value===printScript(assets.packed("scripts",id),session.original))scriptDrafts.delete(id);else scriptDrafts.set(id,area.value);};
    const actions=element("div");actions.className="asset-controls";
    attack.setAttribute("aria-label","Attack to insert");
    for(let n=0;n<240;n++)attack.add(new Option(hex(n)+" "+battleAttackName(session.original,n),n));
    actions.append(attack,toolButton("Insert attack",()=>{
        const start=area.value.lastIndexOf("\n",area.selectionStart-1)+1;
        area.setRangeText("attack "+hex(Number(attack.value))+"\n",start,start,"end");area.oninput();area.focus();
    }),toolButton("Apply script",()=>{
        try {
            assets.set("scripts",id,assembleScript(area.value));
            scriptDrafts.delete(id);area.value=printScript(assets.packed("scripts",id),session.original);
            result.textContent="Applied "+assets.packed("scripts",id).length+" bytes to "+session.name("monsters",id)+".";
            buttons();
        }catch(e){result.textContent=e.message;}
    }),toolButton("Discard draft",()=>{scriptDrafts.delete(id);area.value=printScript(assets.packed("scripts",id),session.original);result.textContent="Draft discarded.";}));
    actions.children[2].id="apply-script";
    const help=element("details");help.append(element("summary","Command reference"));
    help.append(element("pre",["attack ID","choose ID ID ID","target TARGET","formation EFFECT LO HI","message LO HI",
        "command A B C","show_hide ANIMATION MODE MASK","item MODE ITEM1 ITEM2","event ID",
        "variable ID VALUE","switch MODE VARIABLE BIT","animation ANIMATION MASK ARG","effect MODE ARG",
        "if CONDITION ARG1 ARG2","wait","end_block","end"].join("\n")));
    box.append(element("h2","Monster script"),element("p","The first end finishes the main script. The second finishes its counters. Use $ for hexadecimal. Apply the script before export. Unapplied drafts stay available as you browse."),area,actions,help,result);
}
function fieldPanel(box,id) {
    if(mapView.map!==id)mapView={map:id};
    if(id<3){box.append(element("h2","World tiles"));tilePainter(box,id,0);return;}
    const view=id>=431?projectMapROM(session,id):session.original;
    const layers=[0,1,2].map(l=>mapLayerInfo(view,id,l));
    const select=element("select"),work=element("section");
    select.setAttribute("aria-label","Map layer");
    for(let l=0;l<3;l++)if(layers[l].layout)select.add(new Option("Layer "+(l+1)+" · layout "+layers[l].layout,l));
    if(!select.options.length){box.append(element("p","This field map has no tile layers."));return;}
    box.append(element("h2","Map tiles"),select,work);
    const load=()=>{work.replaceChildren();try{tilePainter(work,id,Number(select.value));}catch(e){work.append(element("p",e.message));}};
    if(mapView.layer!==undefined)select.value=String(mapView.layer);
    select.onchange=()=>{mapView={map:id,layer:Number(select.value)};load();};load();
}
function tilePainter(panel,map,l) {
    const assets=sessionAssets(session),rom=projectMapROM(session,map),world=map<3,kind=world?"worlds":"layouts";
    const info=world?{width:map===2?128:256,height:map===2?128:256,layout:map}:mapLayerInfo(rom,map,l),id=info.layout;
    const newRoom=map>=431;
    const packet=newRoom?fromHex(mapProject(session).state.rooms[map-431].layers[l]):assets.packed(kind,id);
    const data=unpackLayout(packet),w=info.width,h=Math.min(info.height,Math.ceil(data.length/w));
    const pal=element("canvas"),drawing=element("canvas"),viewport=element("div"),palette=element("div"),tools=element("div"),status=element("p");
    viewport.className="map-scroll";palette.className="map-palette";tools.className="asset-controls";
    pal.width=pal.height=256;drawing.width=w*16;drawing.height=h*16;
    pal.setAttribute("aria-label","Field tileset");drawing.setAttribute("aria-label","Editable map layer");
    const atlas=element("canvas");atlas.width=atlas.height=256;
    atlas.getContext("2d").putImageData(new ImageData(world?worldAtlas(rom,map):fieldAtlas(rom,map,l,session.row("fieldPalettes",info.palette),l===2?layer3Packet(session,info.gfx3):null),256,256),0,0);
    const ac=pal.getContext("2d"),dc=drawing.getContext("2d");
    let brush=mapView.brush??0,brushW=mapView.brushW??1,brushH=mapView.brushH??1;
    let previous=null,stroke=null,active=null,paletteStart=null;
    function single(n){brush=n;brushW=brushH=1;refreshBrush();}
    function refreshBrush(){Object.assign(mapView,{brush,brushW,brushH});ac.clearRect(0,0,256,256);ac.drawImage(atlas,0,0);ac.strokeStyle="#fff";ac.lineWidth=2;ac.strokeRect((brush%16)*16+1,(brush>>4)*16+1,16*brushW-2,16*brushH-2);status.textContent="Brush "+hex(brush)+" · "+brushW+" × "+brushH;}
    function draw(x,y){const n=data[y*w+x];dc.clearRect(x*16,y*16,16,16);if(n!==undefined)dc.drawImage(atlas,(n%16)*16,(n>>4)*16,16,16,x*16,y*16,16,16);}
    function point(e,c){const r=c.getBoundingClientRect();return [Math.floor((e.clientX-r.left)*c.width/r.width/16),Math.floor((e.clientY-r.top)*c.height/r.height/16)];}
    function cell(x,y){return x>=0 && y>=0 && x<w && y<h && y*w+x<data.length;}
    function paint(x,y){
        for(let j=0;j<brushH;j++)for(let i=0;i<brushW;i++)if(cell(x+i,y+j)){
            data[(y+j)*w+x+i]=brush+16*j+i;draw(x+i,y+j);
        }
    }
    function line(x,y){const [a,b]=previous??[x,y],count=Math.max(Math.abs(x-a),Math.abs(y-b),1);
        for(let i=1;i<=count;i++)paint(Math.round(a+(x-a)*i/count),Math.round(b+(y-b)*i/count));previous=[x,y];}
    function selectBrush(e){
        if(!paletteStart || e.pointerId!==paletteStart.id)return;
        const p=point(e,pal).map(n=>Math.max(0,Math.min(15,n)));
        const x=Math.min(p[0],paletteStart.x),y=Math.min(p[1],paletteStart.y);
        brush=16*y+x;brushW=Math.abs(p[0]-paletteStart.x)+1;brushH=Math.abs(p[1]-paletteStart.y)+1;refreshBrush();
    }
    pal.onpointerdown=e=>{
        if(e.button!==0 || paletteStart)return;
        const [x,y]=point(e,pal);paletteStart={x,y,id:e.pointerId};
        pal.setPointerCapture(e.pointerId);selectBrush(e);
    };
    pal.onpointermove=selectBrush;
    pal.onpointerup=e=>{selectBrush(e);paletteStart=null;};
    pal.onlostpointercapture=pal.onpointercancel=()=>{paletteStart=null;};
    pal.tabIndex=0;
    pal.onkeydown=e=>{
        const offsets={ArrowRight:1,ArrowLeft:-1,ArrowUp:-16,ArrowDown:16};
        if(Object.hasOwn(offsets,e.key)){e.preventDefault();single(Math.max(0,Math.min(255,brush+offsets[e.key])));}
    };
    drawing.oncontextmenu=e=>e.preventDefault();
    drawing.onpointerdown=e=>{
        const [x,y]=point(e,drawing);if(active!==null || !cell(x,y))return;
        if(e.button===2 || e.shiftKey){single(data[y*w+x]);return;}
        if(e.button!==0)return;
        e.preventDefault();active=e.pointerId;drawing.setPointerCapture(active);stroke=data.slice();previous=null;line(x,y);
    };
    drawing.onpointermove=e=>{if(e.pointerId===active){const [x,y]=point(e,drawing);if(cell(x,y))line(x,y);else previous=null;}};
    function finish(e,cancel){
        if(e.pointerId!==active)return;
        active=null;previous=null;
        try{if(cancel)throw Error("Stroke cancelled.");if(newRoom)mapProject(session).setLayer(map,l,data);else saveLayer(assets,id,data,kind);buttons();status.textContent="Layer "+(l+1)+" · brush "+hex(brush);}
        catch(err){data.set(stroke);for(let y=0;y<h;y++)for(let x=0;x<w;x++)draw(x,y);status.textContent=err.message;}
        stroke=null;
    }
    drawing.onpointerup=e=>finish(e,false);drawing.onpointercancel=e=>finish(e,true);
    drawing.onlostpointercapture=e=>finish(e,true);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)draw(x,y);
    const coords=["X","Y"].map((axis,i)=>{
        const label=element("label",axis+" "),input=element("input");
        input.type="number";input.min=0;input.max=(i?h:w)-1;input.step=1;input.value="0";
        input.id="tile-"+axis.toLowerCase();label.append(input);tools.append(label);return input;
    });
    const stamp=toolButton("Paint at coordinates",()=>{
        const [x,y]=coords.map(n=>n.value===""?NaN:Number(n.value));
        if(!Number.isInteger(x)||!Number.isInteger(y)||!cell(x,y)){status.textContent="Choose a stored tile on this layer.";return;}
        stroke=data.slice();active=-1;paint(x,y);finish({pointerId:-1},false);
    });
    stamp.id="paint-tile";tools.append(stamp);
    const shared=new Set();
    if(world || newRoom)shared.add(map);
    else for(let m=3;m<431;m++)for(let j=0;j<3;j++)if(mapLayerInfo(rom,m,j).layout===id)shared.add(m);
    const zoom=element("select");zoom.setAttribute("aria-label","Map zoom");
    for(const n of [0.5,1,2])zoom.add(new Option(n*100+"%",n));zoom.value=mapView.zoom??"1";
    zoom.onchange=()=>{mapView.zoom=zoom.value;drawing.style.width=drawing.width*Number(zoom.value)+"px";drawing.style.height=drawing.height*Number(zoom.value)+"px";};
    viewport.append(drawing);palette.append(pal);pal.id="tile-palette";drawing.id="tile-map";
    if(!world && l<2)tools.append(toolButton("Edit tileset composition",()=>jumpTo("metatiles",info.tileset)));
    if(!world)tools.append(toolButton("Edit tile collision",()=>jumpTo("collision",rom[tables.maps.start+map*33+4])));
    tools.append(zoom,element("span",w+" × "+h+" tiles · "+shared.size+" map"+(shared.size===1?"":"s")+" using this layout"));
    const layout=element("div");layout.className="tile-workspace";layout.append(palette,viewport);
    if(shared.size>1)panel.append(element("p","Shared layout used by maps "+Array.from(shared,n=>hex(n,3)).join(", ")+". Painting changes each one."));
    panel.append(tools,element("p","Choose a tile or drag across the tileset to select a rectangular stamp. Click or drag on the map to paint. Shift-click or right-click picks a tile from the map. Each stroke is one undo."),status,layout);
    zoom.onchange();viewport.scrollLeft=mapView.x??0;viewport.scrollTop=mapView.y??0;
    viewport.onscroll=()=>{mapView.x=viewport.scrollLeft;mapView.y=viewport.scrollTop;};
    refreshBrush();
}

function palettePanel(panel,id) {
    const row=session.row("fieldPalettes",id),grid=element("div");grid.className="color-grid";
    panel.append(element("p","Each row is one SNES subpalette. Changes apply to field maps that use this palette."),grid);
    const hexByte=n=>n.toString(16).padStart(2,"0");
    for(let i=0;i<128;i++) {
        const field="c"+i,bgr=row[field].value,label=element("label",String(i)),input=element("input");
        input.type="color";input.setAttribute("aria-label","Color "+i);input.title="Color "+i;
        const rgb=[0,5,10].map(shift=>Math.round(((bgr>>shift)&31)*255/31));
        input.value="#"+rgb.map(hexByte).join("");
        input.onchange=()=>{
            const values=input.value.slice(1).match(/../g).map(x=>Math.round(parseInt(x,16)*31/255));
            session.set("fieldPalettes",id,field,values[0]|values[1]<<5|values[2]<<10);
            buttons();detail();
        };
        label.append(input);grid.append(label);
    }
}
