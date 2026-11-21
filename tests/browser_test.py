"""Run with Playwright. Usage: browser_test.py ROM TMPDIR [chromium|chrome|msedge|firefox]"""
import hashlib
import json
import platform
from datetime import datetime, timezone
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
rom_path = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve()
out.mkdir(parents=True, exist_ok=True)
REGULAR_SHA = "55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059"
RETAIL = {"0f51b4fca41b7fd509e4b8f9d543151f68efa5e97b08493e4b2a0c06f5d8d5e2":"1.0",
          "10eccc5d2fab81346dd759f6be478dcb682eef981e8d3d662da176e1f9a996bc":"1.1"}
given = rom_path.read_bytes()
payload = given[512:] if len(given) in (0x300200, 0x400200) else given
input_hash = hashlib.sha256(payload).hexdigest()
if input_hash != REGULAR_SHA and input_hash not in RETAIL:
    raise SystemExit("Supply a clean USA v1.0/v1.1 retail ROM or the official Regular v1.6.5 ROM.")
if not __debug__:
    raise SystemExit("Run Python with assertions enabled for this test.")

def word(data, at):
    return int.from_bytes(data[at:at+2], "little")

with sync_playwright() as p:
    import os, shutil
    target=sys.argv[3] if len(sys.argv)>3 else "chromium"
    if target in ("chrome","msedge"):
        browser=p.chromium.launch(channel=target)
    elif target=="firefox":
        browser=p.firefox.launch()
    elif target=="chromium":
        browser=p.chromium.launch(executable_path=os.environ.get("CHROMIUM") or shutil.which("chromium"))
    else:
        raise ValueError("Unknown browser "+target)
    errors=[]
    def new_page():
        tab=browser.new_page(accept_downloads=True,viewport={"width":1360,"height":850})
        tab.on("pageerror",lambda error:errors.append(str(error)))
        tab.on("dialog",lambda d:d.accept())
        tab.route("http://**/*",lambda route:route.abort())
        tab.route("https://**/*",lambda route:route.abort())
        tab.goto((root/"index.html").as_uri())
        return tab
    page=new_page()
    def open_rom(path):
        page.locator("#rom-file").set_input_files(path)
        expect(page.locator("#status")).to_have_text(path.name+" · Regular v1.6")
    def exported(name):
        with page.expect_download() as event:
            page.locator("#save").click()
        path=out/name
        event.value.save_as(path)
        return path.read_bytes()
    def tab(name, row):
        page.locator(f'button[data-key="{name}"]').click()
        page.locator("#records").select_option(str(row))
    def setnum(key, value):
        box=page.locator("#field-"+key)
        box.fill(str(value));box.press("Tab")
    def select(key, value):
        page.locator("#field-"+key).select_option(str(value))
    def field(key):
        return page.locator("#field-"+key)
    if input_hash in RETAIL:
        page.locator("#rom-file").set_input_files(rom_path)
        expect(page.locator("#status")).to_contain_text("Matches the official Regular ROM")
        converted = exported("converted.sfc")
        assert converted[:len(given)-len(payload)] == given[:len(given)-len(payload)]
        original = converted[len(given)-len(payload):]
        assert hashlib.sha256(original).hexdigest() == REGULAR_SHA
        altered = bytearray(payload)
        altered[0xf0000+260*32+8:0xf0000+260*32+10] = (12345).to_bytes(2,"little")
        altered[0xd0000] = 0x20
        trial = out/"modified.smc"
        trial.write_bytes(bytes(range(256))*2 + altered)
        page.locator("#rom-file").set_input_files(trial)
        expect(page.locator("#status")).to_contain_text("Retail content edits preserved")
        tab("monsters",260);expect(field("hp")).to_have_value("12345")
        trial_output = exported("modified-Regular.smc")
        assert hashlib.sha256(trial_output).hexdigest() == "c4b6a8237e33a85b22e1fb08a66701945ba6b8511582da8e574b5418ea2f5193"
        altered[0x25504] ^= 1
        conflict = out/"retail-conflict.sfc";conflict.write_bytes(altered)
        page.locator("#rom-file").set_input_files(conflict)
        expect(page.locator("#status")).to_contain_text("unsupported edits")
        assert exported("after-conflict.smc") == trial_output
    else:
        original = payload
    reference = out/"reference.sfc"
    reference.write_bytes(original)
    open_rom(reference)
    assert exported("untouched.sfc")==original
    tab("mapEditor",20)
    expect(page.locator("#map-object")).to_have_value("mapNPCs/20/4")
    expect(page.locator("#map-commands option").first).to_contain_text("So…magic really DOES exist!?")
    canvas=page.locator("#map-canvas")
    canvas.scroll_into_view_if_needed()
    click=canvas.evaluate("""e=>{const r=e.getBoundingClientRect();return [r.left+(42-e.dataset.x+.5)*16*r.width/e.width,r.top+(25-e.dataset.y+.5)*16*r.height/e.height]}""")
    page.mouse.move(*click);page.mouse.down();page.mouse.move(click[0]+16,click[1]+16,steps=4);page.mouse.up()
    expect(page.locator("#map-prop-x")).to_have_value("43")
    expect(page.locator("#map-prop-y")).to_have_value("26")
    page.locator("#undo").click()
    assert exported("map-drag-undo.sfc")==original
    tab("rooms",415)
    page.get_by_role("button",name="Create independent room").click()
    expect(page.locator("#records")).to_have_value("431")
    tab("fieldScenes",431)
    page.get_by_label("Field event source").fill("set_bit $5AF\nreturn")
    page.get_by_role("button",name="Save and bind scene").click()
    authored=exported("new-room.sfc")
    open_rom(out/"new-room.sfc")
    tab("fieldScenes",431)
    expect(page.get_by_label("Field event source")).to_have_value("set_bit $5AF\nreturn")
    assert exported("new-room-reopened.sfc")==authored
    open_rom(reference)
    tab("graphicsSheets",1)
    page.get_by_label("PNG colors").select_option("index")
    with page.expect_download() as png_event:
        page.get_by_role("button",name="Export PNG").click()
    png=out/"character-sheet.png"
    png_event.value.save_as(png)
    assert png.read_bytes()[:8]==bytes.fromhex("89504e470d0a1a0a")
    page.get_by_label("Import PNG",exact=True).set_input_files(png)
    page.get_by_role("button",name="Apply import").click()
    expect(page.locator("#status")).to_have_text("PNG imported.")
    assert exported("png-roundtrip.sfc")==original
    tab("monsterScripts",260)
    source=page.locator("#ai-source")
    before=source.input_value()
    source.fill("wait\n"+before)
    page.locator("#apply-script").click()
    page.locator("#undo").click()
    expect(source).to_have_value(before)
    tab("mapTiles",415)
    palette=page.locator("#tile-palette"); canvas=page.locator("#tile-map")
    palette.scroll_into_view_if_needed()
    rect=palette.bounding_box()
    page.mouse.move(rect["x"]+17,rect["y"]+17);page.mouse.down()
    page.mouse.move(rect["x"]+34,rect["y"]+34);page.mouse.up()
    canvas.click(position={"x":8,"y":8})
    assert page.evaluate('Array.from(unpackLayout(sessionAssets(session).packed("layouts",350)).slice(0,2))')==[17,18]
    painted=exported("painted.sfc")
    assert painted!=original
    open_rom(out/"painted.sfc");tab("mapTiles",415)
    assert page.evaluate('unpackLayout(sessionAssets(session).packed("layouts",350))[33]')==34
    open_rom(reference)
    tab("monsters",451)
    expect(field("hp")).to_have_value("32000")
    setnum("hp",32123)
    tab("formations",579)
    expect(field("monster6")).to_have_value("451")
    opts=set(field("monster6").locator("option").evaluate_all("o=>o.map(x=>Number(x.value))"))
    assert opts==set(range(384))|set(range(416,452))|{511}
    for index in [255,256,451]:
        select("monster6",index)
        result=exported(f"formation-{index}.sfc")
        pos=0x3022c8+579*15
        assert result[pos+7]==index&255
        assert result[pos+14]==(original[pos+14]&31)|(index>>8<<5)
        assert result[pos:pos+7]==original[pos:pos+7] and result[pos+8:pos+14]==original[pos+8:pos+14]
    select("monster6",511)
    expect(field("monster6Present")).not_to_be_checked()
    page.locator("#undo").click()
    expect(field("monster6Present")).to_be_checked()
    page.locator("#redo").click()
    expect(field("monster6")).to_have_value("511")
    page.locator("#undo").click()
    tab("formations",644);select("monster1",451)
    tab("items",270);setnum("cost",3210)
    tab("items",0);setnum("cost",4321)
    assert "255" not in page.locator("#records option").evaluate_all("o=>o.map(x=>x.value)")
    tab("loot",451)
    assert len(field("rareDrop").locator("option").all())==256
    assert field("rareDrop").locator('option[value="256"]').count()==0
    select("rareDrop",254)
    tab("espers",30)
    assert set(field("spell5").locator("option").evaluate_all("o=>o.map(x=>Number(x.value))"))==set(range(54))|{255}
    select("spell5",10); setnum("rate5",6)
    tab("addedMagic",2);setnum("mpCost",37)
    tab("addedSummons",0);setnum("spellPower",77)
    tab("maps",415)
    expect(field("layout1")).to_have_value("350");expect(field("layout2")).to_have_value("351")
    expect(field("layout1")).to_be_disabled();select("song",6)
    tab("maps",430);select("song",7)
    result=exported("edited.sfc")
    expected=bytearray(original)
    def patch(at,value,width=1):
        expected[at:at+width]=value.to_bytes(width,"little")
    patch(0x380000+451*32+8,32123,2)
    patch(0x3022c8+644*15+2,195)
    patch(0x360269+270*30+28,3210,2)
    for base in [0x360269,0x185000]:patch(base+28,4321,2)
    patch(0x3844dc+451*4+2,254)
    patch(0x186e00+30*11+8,6);patch(0x186e00+30*11+9,10)
    patch(0x3018a6+5,37);patch(0x301828+6,77)
    patch(0x322996+415*33+28,6);patch(0x322996+430*33+28,7)
    expected[0xffdc:0xffe0]=result[0xffdc:0xffe0]
    assert bytes(expected)==result, "unexpected modified bytes"
    assert word(result,0xffdc)^word(result,0xffde)==65535 and sum(result)&65535==word(result,0xffde)
    assert result[0x46f3c:0x46f4a]==original[0x46f3c:0x46f4a]
    page.close();page=new_page()
    open_rom(out/"edited.sfc")
    tab("addedMagic",2);expect(field("mpCost")).to_have_value("37")
    tab("formations",644);expect(field("monster1")).to_have_value("451")
    tab("monsters",451);expect(field("hp")).to_have_value("32123")
    setnum("hp",31987);second=exported("second.sfc")
    assert word(second,0x380000+451*32+8)==31987
    tab("monsters",451);page.locator("#search").fill("Ice Dragon")
    assert "451" in page.locator("#records option").evaluate_all("o=>o.map(x=>x.value)")
    page.locator("#search").fill("no-such-monster");expect(page.locator("#detail h1")).to_have_text("No matching records")
    header=bytes(range(256))*2
    (out/"headered.smc").write_bytes(header+original)
    open_rom(out/"headered.smc");assert exported("headered-noop.smc")==header+original
    setnum("hp",32123);assert exported("headered-edit.smc")==header+(out/"formation-451.sfc").read_bytes()
    outside=bytearray(original);name_at=0x360080+14*13+1;outside[name_at]=0x92
    (out/"other-tool.sfc").write_bytes(outside);open_rom(out/"other-tool.sfc")
    tab("items",270);expect(field("name")).to_have_value("Sone Wrist")
    field("name").fill("Den Wrist");field("name").press("Tab");field("equip0").check()
    tab("monsters",451);field("name").fill("Frost Wyrm");field("name").press("Tab")
    tab("formations",579)
    expect(field("monster6").locator("option:checked")).to_contain_text("Frost Wyrm")
    expect(page.locator("#preview canvas")).to_be_visible()
    result=exported("community-edit.sfc")
    page.close();page=new_page();open_rom(out/"community-edit.sfc")
    tab("items",270);expect(field("name")).to_have_value("Den Wrist");expect(field("equip0")).to_be_checked()
    setnum("cost",4321);exported("before-undo.sfc");page.locator("#undo").click()
    assert exported("after-undo.sfc")==result
    tab("espers",27);expect(field("rate1")).to_be_disabled()
    incompatible=bytearray(original);incompatible[0x25504]^=1
    (out/"unsupported.sfc").write_bytes(incompatible)
    page.locator("#rom-file").set_input_files(out/"unsupported.sfc")
    expect(page.locator("#status")).to_contain_text("Item properties layout conflict")
    if input_hash in RETAIL:
        page.close();page=new_page()
        page.goto((root/"Windows-browser-check.html").as_uri())
        page.get_by_label("Retail ROM",exact=True).set_input_files(rom_path)
        expect(page.locator(".browser-check [role=status]")).to_contain_text("checks passed so far", timeout=30000)
        with page.expect_download() as event:
            page.locator("#save").click()
        preset=out/"native-preset.smc"
        event.value.save_as(preset)
        tab("items",270)
        setnum("cost",43210);setnum("power",100);setnum("accuracy",100)
        with page.expect_download() as event:
            page.locator("#save").click()
        saved=out/"native-reopen.smc"
        event.value.save_as(saved)
        page.get_by_text("Reload for reopen check",exact=True).click()
        page.get_by_label("Reopen downloaded ROM").set_input_files(preset)
        expect(page.locator(".browser-check [role=status]")).to_contain_text("differs from your last export")
        page.get_by_label("Reopen downloaded ROM").set_input_files(saved)
        expect(page.locator(".browser-check [role=status]")).to_contain_text("PASS.")
        with page.expect_download() as event:
            page.get_by_text("Save test report",exact=True).click()
        event.value.save_as(out/"native-report.json")
        native=json.loads((out/"native-report.json").read_text())
        assert native["outcome"]=="PASS" and native["editedSHA256"]==hashlib.sha256(saved.read_bytes()).hexdigest()
        assert native["scriptedEditsSHA256"]==hashlib.sha256(preset.read_bytes()).hexdigest()
    assert not errors,errors
    report = dict(suite="FF6Tools SNES Advance 0.7 Playwright", outcome="PASS",
                  os=platform.system(), osRelease=platform.release(), browser=target,
                  browserVersion=browser.version, timeUTC=datetime.now(timezone.utc).isoformat(),
                  retailRevision=RETAIL.get(input_hash), officialRegularSHA256=REGULAR_SHA)
    (out/"browser-report.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print("PASS",target,browser.version,"offline file open, export, close/reopen, undo after export, header handling, outside edits, names, equipment, preview, fixed teaching and conflicts.")
    browser.close()
