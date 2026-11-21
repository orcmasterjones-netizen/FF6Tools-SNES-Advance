// Optional file:// acceptance test for installed desktop browsers. GPL-3.0.
"use strict";

const browserReopen = /^#browser-test-reopen-v07-(1\.[01])-([0-9a-f]{64})$/;
if (typeof location !== "undefined" && (location.hash === "#browser-test" || browserReopen.test(location.hash))) {
    startLocalBrowserCheck();
}

function startLocalBrowserCheck() {
    const panel = document.createElement("section");
    panel.className = "browser-check";
    document.querySelector("main").before(panel);
    const title = element("h2", "Offline browser check");
    const info = element("p");
    info.setAttribute("role", "status");
    const actions = element("div");
    panel.append(title, info, actions);
    const importedHash = "c4b6a8237e33a85b22e1fb08a66701945ba6b8511582da8e574b5418ea2f5193";
    const fixtureHash = "f18ce0e68ea9a43f3bd3ae90a6a807f6090cf3b0c24e9088409c7852c1dcc4a0";
    const retailHashes = {
        "0f51b4fca41b7fd509e4b8f9d543151f68efa5e97b08493e4b2a0c06f5d8d5e2":"1.0",
        "10eccc5d2fab81346dd759f6be478dcb682eef981e8d3d662da176e1f9a996bc":"1.1"
    };
    function requireValue(condition, message) {
        if (!condition) throw Error(message);
    }
    function pick(label, run) {
        const wrap = element("label", label+" ");
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".sfc,.smc,.bin";
        wrap.append(input);
        actions.replaceChildren(wrap);
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;
            input.disabled = true;
            try { await run(file); }
            catch (error) {
                info.textContent = "Check stopped. "+error.message;
                input.disabled = false;
                input.value = "";
            }
        };
    }
    async function openThroughUI(file, expected) {
        const chooser = el("rom-file");
        const transfer = new DataTransfer();
        transfer.items.add(file);
        chooser.files = transfer.files;
        // Await the same async handler the visible Open ROM file chooser dispatches.
        await chooser.onchange({target:chooser});
        requireValue(el("status").textContent.includes(expected), el("status").textContent);
    }
    function choose(key, id) {
        document.querySelector('button[data-key="'+key+'"]').click();
        const records = el("records");
        records.value = String(id);
        records.dispatchEvent(new Event("change"));
    }
    function setField(key, value) {
        const field = el("field-"+key);
        field.value = String(value);
        field.dispatchEvent(new Event("change"));
    }
    function action(label, fn) {
        const button = element("button", label);
        button.onclick = fn;
        actions.replaceChildren(button);
    }
    async function first(file) {
        const data = new Uint8Array(await file.arrayBuffer());
        const payload = data.subarray(data.length === 0x300200 ? 512 : 0);
        const revision = retailHashes[await hashBytes(payload)];
        requireValue(revision, "Choose a clean Final Fantasy III USA v1.0 or v1.1 ROM to create the test copies.");
        info.textContent = "Checking clean conversion, edited retail content and the editor controls…";
        await openThroughUI(new File([payload],"clean-retail.sfc"), "Matches the official Regular ROM");
        requireValue(await hashBytes(session.export()) === REGULAR_SHA, "Clean conversion differed from the release.");
        const mod = payload.slice();
        new DataView(mod.buffer).setUint16(0xf0000+260*32+8, 12345, true);
        mod[0xd0000] = 0x20;
        const prefix = Uint8Array.from({length:512}, (_,i) => i & 255);
        await openThroughUI(new File([prefix, mod], "browser-check.smc"), "Retail content edits preserved");
        requireValue(await hashBytes(session.export()) === importedHash, "Modified conversion or copier header differed.");
        choose("monsters",260);
        requireValue(el("field-hp").value === "12345", "Imported HP was missing from the editor.");
        // Check a failed replacement while the imported session is still clean.
        mod[0x25504] ^= 1;
        await openThroughUI(new File([mod],"conflict.sfc"), "unsupported edits");
        requireValue(await hashBytes(session.export()) === importedHash, "Conflicting input replaced the open ROM.");
        choose("formations",579);
        requireValue(document.querySelector("#preview canvas") && el("field-monster6").value === "451", "Formation preview or nine-bit monster ID failed.");
        setField("monster6",511);
        requireValue(!el("field-monster6Present").checked, "Empty formation slot stayed active.");
        el("undo").click();
        requireValue(el("field-monster6").value === "451" && el("field-monster6Present").checked, "Formation undo failed.");
        choose("monsterScripts",260);
        const script=el("ai-source"), initial=script.value;
        script.value="wait\n"+initial;script.dispatchEvent(new Event("input"));el("apply-script").click();
        requireValue(sessionAssets(session).packed("scripts",260)[0]===253,"Monster script edit failed.");
        const aiCopy=await AdvanceRom.open(session.export());
        requireValue(sessionAssets(aiCopy).packed("scripts",260)[0]===253,"The edited script did not reopen.");
        el("undo").click();
        requireValue(el("ai-source").value===initial,"Monster script undo failed.");
        choose("mapTiles",415);
        const assets=sessionAssets(session), layout=mapLayerInfo(session.original,415,0).layout;
        const oldTile=unpackLayout(assets.packed("layouts",layout))[0];
        const brush=oldTile===0?1:0;
        if(brush)el("tile-palette").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight"}));
        el("paint-tile").click();
        requireValue(unpackLayout(assets.packed("layouts",layout))[0]===brush,"Painting a field tile failed.");
        const mapCopy=await AdvanceRom.open(session.export());
        requireValue(unpackLayout(sessionAssets(mapCopy).packed("layouts",layout))[0]===brush,"The painted map did not reopen.");
        el("undo").click();
        requireValue(unpackLayout(assets.packed("layouts",layout))[0]===oldTile,"Map undo failed.");
        requireValue(await hashBytes(session.export())===importedHash,"Workshop undo left changes behind.");
        choose("mapEditor",20);
        const mapField=(field,val)=>{const input=el("map-prop-"+field);input.value=String(val);input.dispatchEvent(new Event("change"));};
        const mapTool=(tool,x,y)=>{
            const control=el("map-tool");control.value=tool;control.dispatchEvent(new Event("change"));
            el("map-x").value=String(x);el("map-y").value=String(y);el("map-use").click();
        };
        mapTool("select",42,25);
        requireValue(el("map-object").value==="mapNPCs/20/4" && el("map-commands").options[0].textContent.includes("So…magic really DOES exist!?"),"The Narshe map did not link its NPC to dialogue 919.");
        const talker=mapObjects(session,20,session.original).find(o=>o.key==="mapNPCs/20/4");
        requireValue(await hashBytes(mapNPCPixels(session.original,talker))==="030c17a970f4d56b79eab68056414fc36798517766c6f9dda774abe2b0541655","The Narshe NPC pose pixels differ from the verified game sprite.");
        mapField("facing",1);
        const talk=el("map-event-source");talk.value="dialogue $0398\nreturn";talk.dispatchEvent(new Event("input"));
        el("map-apply-event").click();
        choose("mapEditor",415);mapTool("mapTreasure",12,12);mapField("value",233);
        mapTool("mapEvents",13,12);
        const floorEvent=el("map-event-source");floorEvent.value="set_bit $5AD\nreturn";floorEvent.dispatchEvent(new Event("input"));el("map-apply-event").click();
        const paintedBefore=unpackLayout(assets.packed("layouts",layout))[0];
        const paintMode=el("map-tool");paintMode.value="paint";paintMode.dispatchEvent(new Event("change"));
        if(!paintedBefore)el("map-brush").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight"}));
        el("map-x").value=el("map-y").value="0";el("map-use").click();
        const afterMap=await AdvanceRom.open(session.export()),mapState=mapProject(afterMap).state;
        requireValue(mapState.objects.length===2 && mapState.objects[0].data.endsWith("e9") && mapState.objects[1].scene===1,"Placed chest or tile trigger did not reopen.");
        requireValue(mapState.bindings["mapNPCs/20/4"]===0 && mapState.scenes[0].source.includes("$0398"),"The edited Narshe talk event did not reopen.");
        requireValue(unpackLayout(sessionAssets(afterMap).packed("layouts",layout))[0]!==paintedBefore,"Composite painting did not reopen.");
        while(session.model.undoStack.length)el("undo").click();
        requireValue(await hashBytes(session.export())===importedHash,"Map workspace undo left ROM changes behind.");
        // Use the visible controls for all authored changes, then undo to the known retail fixture.
        const buttonByText=(root,text)=>{
            for(const node of root.children){
                if((node.tagName??node.tag)?.toLowerCase()==="button" && node.textContent===text)return node;
                const found=buttonByText(node,text);if(found)return found;
            }
        };
        choose("rooms",415);buttonByText(el("detail"),"Create independent room").click();
        requireValue(selected===431 && mapProject(session).state.rooms.length===1,"Create room failed.");
        choose("fieldScenes",431);
        let source=el("author-source");source.value="set_bit $5AF\nreturn";source.dispatchEvent(new Event("input"));
        choose("battleEvents",16);el("save").click();
        requireValue(selected===431 && el("author-source").value===source.value,"Field event draft was lost.");
        buttonByText(el("detail"),"Save and bind scene").click();
        const authored=await AdvanceRom.open(session.export());
        requireValue(mapProject(authored).state.startup[431]===0,"Entrance binding did not reopen.");
        choose("battleEvents",16);source=el("author-source");source.value="noop\nend";source.dispatchEvent(new Event("input"));
        buttonByText(el("detail"),"Apply battle event").click();
        requireValue(mapProject(session).state.battle[16]==="noop\nend","Battle event control failed.");
        choose("frames",2948);requireValue(Boolean(el("author-source")),"Added animation frame failed to open.");
        el("undo").click();el("undo").click();el("undo").click();
        requireValue(await hashBytes(session.export())===importedHash,"Authoring undo left changes behind.");
        choose("graphicsSheets",1);
        const pngMode=el("graphic-mode");pngMode.value="generate";pngMode.dispatchEvent(new Event("change"));
        const picker=el("graphic-png"),files=new DataTransfer();
        const png=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEElEQVR4nGP4z8Dw/z8QAQAT9QT8UkQ3KAAAAABJRU5ErkJggg=="),ch=>ch.charCodeAt(0));
        files.items.add(new File([png],"two-color.png",{type:"image/png"}));picker.files=files.files;
        await picker.onchange();
        const dims=(key,n)=>{const e=el("graphic-"+key);e.value=String(n);e.dispatchEvent(new Event("input"));};
        dims("w",1);dims("sx",1);dims("dx",5);dims("dy",4);
        choose("items",270);el("save").click();
        requireValue(el("status").textContent.includes("graphic import preview"),"The pending PNG was lost.");
        el("graphic-apply").click();
        requireValue(el("status").textContent==="PNG imported.","Regional PNG import failed.");
        const graphicCopy=await AdvanceRom.open(session.export()),art=graphicSheet(graphicCopy,"sprite",0);
        const cell=4*art.w+5;
        requireValue(art.colors[art.indices[cell]].join(",")==="255,0,255","The cropped pixel did not reopen in its generated color.");
        el("undo").click();
        requireValue(await hashBytes(session.export())===importedHash,"Graphics and palette did not undo together.");
        choose("monsters",451);setField("hp",32123);
        choose("items",270);setField("cost",4321);
        el("undo").click();el("redo").click();
        requireValue(await hashBytes(session.export()) === fixtureHash, "The scripted edits differed from the known test ROM.");
        info.textContent = "The checks passed so far. You can make your own edits now. Use Export ROM, then reload here and select your most recent download.";
        actions.replaceChildren();
        const testSession = session;
        let latestDownload;
        el("save").addEventListener("rom-exported", event => {
            // Use the immutable Blob from the actual download, including its copier header.
            latestDownload = event.detail;
            if (session !== testSession) {
                actions.replaceChildren();
                info.textContent = "A different ROM was exported. Restart the browser check to verify a new test session.";
                return;
            }
            action("Reload for reopen check", async () => {
                const download = latestDownload;
                try {
                    const hash = await hashBytes(await download.arrayBuffer());
                    if (download !== latestDownload) return;
                    location.hash = "browser-test-reopen-v07-"+revision+"-"+hash;
                    location.reload();
                } catch (error) {
                    info.textContent = "Could not record the export for verification. "+error.message;
                }
            });
        });
    }
    const receipt = browserReopen.exec(location.hash);
    async function reopen(file) {
        const [, revision, expectedHash] = receipt;
        const raw = new Uint8Array(await file.arrayBuffer());
        const actualHash = await hashBytes(raw);
        requireValue(actualHash === expectedHash, "This file differs from your last export. Select the newest downloaded .smc, including any number the browser added to its name. Expected SHA-256 "+expectedHash+". Selected "+actualHash+".");
        await openThroughUI(file, " · Regular v1.6");
        const data = new DataView(raw.buffer, raw.byteOffset+512, raw.byteLength-512);
        function checkField(key, expected, label) {
            requireValue(el("field-"+key).value === String(expected), label+" did not match the saved file.");
        }
        choose("monsters",260);checkField("hp",data.getUint16(0x380000+260*32+8,true),"Imported monster HP");
        choose("monsters",451);checkField("hp",data.getUint16(0x380000+451*32+8,true),"Edited monster HP");
        choose("items",270);
        const wrist = 0x360269+270*30;
        checkField("cost",data.getUint16(wrist+28,true),"Item price");
        checkField("power",data.getUint8(wrist+20),"Defense");
        checkField("accuracy",data.getUint8(wrist+21),"Magic defense");
        requireValue(await hashBytes(session.export()) === expectedHash, "Reopened export differed from the downloaded file.");
        const report = {
            suite:"FF6Tools SNES Advance 0.7 native browser check",
            outcome:"PASS", timeUTC:new Date().toISOString(),
            platform:navigator.platform, browser:navigator.userAgent, protocol:location.protocol,
            retailRevision:revision, editedSHA256:actualHash, scriptedEditsSHA256:fixtureHash,
            checks:["catalogued clean output","modified retail import","copier header","atomic conflict",
                "formation preview and high ID","monster script edit, reopen and undo","map painting, reopen and undo","composite map paint, exact Narshe NPC dialogue, event rebinding, chest and trigger placement, export/reopen and undo","new room and entrance binding","field draft recovery","battle events and added frames","native PNG decode, source crop, destination placement, palette generation and combined undo","undo and redo","native download","page reload and file reopen","whole-file equality"]
        };
        info.textContent = "PASS. The downloaded ROM reopened after a page reload with the saved edits and copier header intact. Save the report for this browser.";
        action("Save test report", () => {
            const url = URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+"\n"],{type:"application/json"}));
            const a = element("a");
            a.href = url;
            const family = /Firefox\//.test(report.browser) ? "Firefox" : /Edg\//.test(report.browser) ? "Edge" : /Chrome\//.test(report.browser) ? "Chrome" : "browser";
            a.download = "FF6Tools-native-"+family+".json";
            a.click();setTimeout(() => URL.revokeObjectURL(url),30000);
        });
    }
    if (receipt) {
        info.textContent = "Select your most recent test .smc. All edits made before that export are included in this check.";
        pick("Reopen downloaded ROM", reopen);
    } else {
        info.textContent = "Choose a clean USA retail ROM. The check makes its own edited test copy in memory. You will save it and reopen it once.";
        pick("Retail ROM", first);
    }
}
