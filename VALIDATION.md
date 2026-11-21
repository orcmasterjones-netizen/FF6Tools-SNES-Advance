# Editor v0.7 validation

| Map workspace check | Result |
|---|---|
| Map coverage | Opened all 431 Regular records. Composited sample tiles on all 424 records with stored artwork. The other seven have no layout. Checked overlapping layer priority, transparency inputs, signed offsets and subscreen blending with separate fixtures. |
| Narshe sprite rendering | Corrected a 13-byte error in the pose table lookup. The preview follows the address used by Regular’s field sprite loader ($C0/CE47). For sprite $17 facing left and right, all 239 opaque pixels of each pose matched the five-bit SNES colors in captures from Snes9x. The editor also draws the object markers behind the characters. |
| Narshe | Selected NPC slot 4 at (42, 25), followed event $CC/D1FF to dialogue ID 919, edited its text and rebound its event to dialogue 920. The DOM and ROM tests cover editing, export/reopen and undo. |
| Canvas and inspector | Tested dragging an NPC, undoing both axes together, placing an item chest, painting a rectangular tile stamp, cancelling a stroke and recovering an unapplied event draft after browsing to another table. Checked stacked objects, long-exit footprints, shared scenes and per-object copies. |
| Added room in Snes9x | Entered a new room from the Dragon’s Den, ran its entrance event, talked to its NPC, stepped on a floor trigger, collected the chest item once, and inspected the loaded tile and return exit. |
| Compatibility | Included ROM-model, workshop, retail import, authoring, PNG and UI regression suites. Reopened a 0.6 authored annex and exported it byte-for-byte. The archive contains no ROM or save file. |
| Desktop browser acceptance | The interactive Windows check now includes the Narshe link, composite painting, a Dragon’s Den chest, an NPC event and a floor trigger. Windows Chrome 157 and Firefox 160 each passed all 16 reported checks. Both runs opened the extracted editor locally and used clean USA v1.0 as the retail input. |

### Windows results for v0.7

| Browser | Input | Offline checks | Original report |
|---|---|---:|---|
| Chrome 157 on Windows | USA v1.0 | 16/16 PASS | [Chrome JSON](tests/reports/v0.7/FF6Tools-native-Chrome.json) |
| Firefox 160 on Windows | USA v1.0 | 16/16 PASS | [Firefox JSON](tests/reports/v0.7/FF6Tools-native-Firefox.json) |

Both runs on November 21, 2026 produced the expected scripted SHA-256, `f18ce0e68ea9a43f3bd3ae90a6a807f6090cf3b0c24e9088409c7852c1dcc4a0`. The check allows further edits before download. Each report records its own final export hash and verifies the whole file after reloading the page and reopening the download. The original reports retain the preview label used during testing. The release uses the same editor code and ROM data.

Run `node tests/map-workspace.cjs Regular.sfc` for the map checks. Optional second and third paths write an emulator fixture and check an older authored ROM. **Windows-browser-check.html** runs the offline acceptance check. The Playwright suite also includes an actual mouse drag.

## Editor 0.6 validation history

Checked on SNES Advance Regular v1.6.5. The six original test suites and the regional graphics tests were run on the packaged editor.

| Check | Result |
|---|---|
| Regional graphics and undo | Verified nonzero source and destination coordinates, untouched surrounding pixel indices, exact and nearest-color mapping, transparent pixels, opaque black, and palette entries protected by pixels outside the target. Checked deterministic color reduction and undo after an interrupted two-part import. |
| Palette formats and reopen | Changed artwork and generated palettes on a 3 bpp monster, an added 4 bpp monster, a field sprite, ordinary field tiles, layer 3 and all three world maps. Reopened each ROM and verified every resulting ink and palette color. Undo restored the clean file byte-for-byte. |
| TunnelArmr in Snes9x | In formation 436, a full recolor changed 3,663 screen pixels at frame 300. The changed pixels were 1,215 magenta and 2,448 cyan. A separate 8 × 8 crop changed exactly 64 pixels at screen coordinates (56–63, 80–87) in the same replay. The rest of the captured frame matched the clean control. |
| Serpent Trench in Snes9x | A generated subpalette changed 15 inks and moved the compressed palette to $D8EE48. Verified all 512 decompressed palette bytes in game WRAM after loading the trench. |
| Windows acceptance check | The interactive check uses a two-pixel PNG, crops the second pixel, places it at (5, 4), generates a shared palette, exports and reopens it, and checks combined undo. Its control flow passed under the DOM test double. Native Windows reports are pending for 0.6. Local Chromium could not initialize its Unix socket and the Playwright Firefox executable was unavailable here. |

# Previous 0.5 preview validation

The reference is SNES Advance Regular v1.6.5, SHA-256 `55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059`. All game checks below used exported ROMs.

| Check | Result |
|---|---|
| New room in Snes9x | From map $19F, walking onto the exit at (9, 9) loaded the new map $1AF. Its entrance set event bit $5AF. Returning through the opposite exit restored $19F. Repeated trips worked. The annex’s painted first tile was $8B while the original room retained $8A. |
| Collision in Snes9x | The same save loaded tile $F1 from shared collision set 12 as $8F01 in the clean control and $0000 in the edited game. Checked both property bytes in WRAM. |
| NPC, tile trigger and chest in Snes9x | On separate replays from the new room, speaking to the visible NPC at (11, 9) and walking onto (10, 10) each set the assigned event flag. The chest at (10, 8) gave item $E9. Its inventory count went from zero to one, its opened flag was set, and repeated interaction kept the count at one. |
| Battle event in Snes9x | In formation 436, TunnelArmr’s edited AI invoked event $10. The event hid all four menu rows; all four were hidden by frame 291. Its AI then set variable $1F to $19 by frame 360. The clean control kept its menu rows and the variable stayed zero over 1,400 frames. |
| Event and map storage | All 33 original battle lists disassembled and reassembled byte for byte. Tests compared the five live object directories, including all stock records, with their sources. They also checked a binding on an existing trigger, new short and long exits, a duplicate map’s independent layer, invalid scripts, a full NPC list, occupied space and a deliberately corrupted compiled event. |
| Tilesets and graphics | Decoded all 75 field metatile sets, changed a quadrant’s flip, and verified the reopened word. Changed a pixel in seven sheets covering an added monster, field sprite, field graphics, layer 3 and all three worlds. Ran each through a real PNG encode/decode with Pillow and checked the ROM-backed pixel after reopen. Invalid alpha was rejected. |
| Battle animation data | All 3,025 frame IDs decoded. Edited an original frame and an added frame, a configuration, and an added resource used by that configuration. Checked bytes, bounds, headered reopen and undo. These were editor and ROM checks; individual effects were not played in sequence. |
| Regression and browser tests | Regular, both USA retail revisions, headered files, modified retail content, original editor controls, checksum and byte-identical no-op and undo passed. The DOM harness also exercised new-room creation, event draft recovery, binding, reopening and undo. The historical Windows reports cover 0.3. Version 0.5 still needs native Windows sign-off. Local Chromium stopped at socket initialization and the Playwright Firefox executable was unavailable. |

To build the test ROM locally, run `node tests/authoring.cjs Regular.sfc annex-test.sfc --png`. The optional PNG pass uses Python and Pillow. This fixture includes deliberate changes for testing, including a battle event that hides the menu. The editor applies those changes only when running the test on a supplied ROM. **Windows-browser-check.html** runs the interactive download and reopen test in a desktop browser.

# Previous 0.4 preview validation

The reference image for these checks was SNES Advance Regular v1.6.5, SHA-256 `55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059`.

| Check | Result |
|---|---|
| Monster scripts | All 420 selectable AI scripts decoded into editable commands and reassembled byte for byte. Tests covered both script endings, overlap with another monster’s script, growth, shrinkage, undo, redo, export, reopen and refusal to overwrite an occupied expansion. |
| Monster AI in Snes9x | A test extended TunnelArmr’s AI beyond its original 57-byte record and moved it to SNES $F95600. In formation 436 the edited AI set battle variable $1F to $19 on frame 246. The unchanged control ran 1,800 frames from the same state and inputs and never set that value. This checks execution of the relocated script. |
| Field maps | All 970 nonempty map/layer references decoded and produced tile atlases. This count includes shared layouts used by different maps. The painter limits strokes to stored data and preserves bytes outside the visible layer. Undo, redo, export and reopening were exercised. |
| Dragon’s Den in Snes9x | Editing the entrance forced layer 1, layout 350, into new storage at SNES $F30000. After loading the same save on map $19F, layer 1 at (8, 8) contained $B2 on the control and the requested $B3 on the edited ROM. Both observations came from game WRAM at $7F0808. |
| World maps in Snes9x | Painted an eight-tile strip starting at (17, 21) on each of the World of Balance, World of Ruin and Serpent Trench maps. Loaded each map in an original and an edited ROM. All 24 edited tiles and all 24 control tiles matched their respective expected tile IDs in WRAM. |
| Map objects and field palettes | Verified all 5,299 object records against their map’s pointer interval. Edited the position in each of the five table types and a 15-bit field palette color, exported, and checked the destination bytes and complete undo. |
| Field dialogue | Across three banks, 3,259 independently decodable entries round-tripped byte for byte and 3,252 IDs have unique editable storage. Edits in each bank survived reopen, preserved controls and stayed within their own slots. Oversized text and an unencodable glyph were rejected. |
| Character, shop and skill tables | Made one edit in each of the nine tables. Checked the active location, applicable mirror, reopened value and byte-identical undo. |
| Editor controls | Exercised the real HTML handlers in a Node DOM test double, including script drafts, 2 × 2 tile stamps, eyedropper, history, palette changes, dialogue edits, export and reopen. The native browser harness now checks applying AI and map changes, reopening the generated bytes and undoing those changes. The Playwright suite includes pointer dragging and an exported painted ROM. |
| Browser status | Windows Chrome and Firefox reports below cover 0.3. Fresh 0.4 Windows reports are pending. Local Chromium stopped at its Unix socket initialization before a page opened. |

Field and world tile checks establish that the game read the edited layouts. Only the named scenes and battle were run in Snes9x. Palette, table and dialogue coverage above is based on model and byte comparisons. The CLI test command is `node tests/workshop.cjs Regular.sfc`.

# Previous 0.3 release validation

Tests used the 4 MiB SNES Advance Regular output of the v1.6.5 release. Reference SHA-256 is `55299ab791580ab09ffabb105f8d4b6f35b068873f74f299a0eb492e0fb76059`.

| Check | Result |
|---|---|
| Outside edit and reopen | Changed the first letter of Bone Wrist and an unrelated byte outside the editor, opened the result, edited the price, exported and reopened. The outside edits survived. The output matched the independently constructed expected bytes, including both checksums. |
| Actual layout conflicts | Moving the operand at $C25503 triggered an item-properties conflict. Mutating each profiled instruction or the start of each checked code range was tested independently. Divergent item and monster copies and the added equipment menu masks have explicit diagnostics. This covers the profiled layout, not arbitrary changes to control flow. |
| High IDs, undo and clean copies | Each of six formation slots survived edits across $0FF, $100 and $1C3, empty, reopen and undo. Checks cover all supported rows, shared upper bits, names in both tables, item icon preservation, mixed edits and a second session. A clean headerless input and a copier-header input both survived no-edit export unchanged. |
| Added equipment | All 14 character bits on all 15 added items were toggled, the corresponding property and menu words checked, then the edits were undone. Neighboring flag bits survived. Tests also exercise undo after an export followed by an edit on a new undo branch. |
| Browser controls | Chrome 157 and Firefox 160 on Windows each passed all nine native checks, including a real download and reopen. The shipping handlers also passed the DOM unit test. |

## Snes9x gameplay checks

**Equipment and a Den fight.** The edited ROM renamed Final Trump to Den Saber, allowed Terra to use it and set its power to 147. Bone Wrist became Den Wrist with Terra enabled, 50 defense and 60 magic defense. From a prepared save state with the items in the bag, controller inputs equipped both through the normal Equip and Relic menus. The control Relic menu excluded Bone Wrist for Terra. The field engine then started formation 580, with Zurvan renamed Den Sentry, moved to X=80 and given 12,345 HP. Terra held the two correct expanded item tokens, and her attack took Den Sentry from 12,345 to 2,346 HP. The harness selected the encounter through battle-start WRAM. It did not walk the dungeon to trigger a random battle.

**Bone Wrist effects.** A separate paired battle setup equipped the relic on Umaro. The original record gave him 158 defense and 137 magic defense. Editing only the relic’s two defensive stats raised those readings to 198 and 187.

**Learning and loot.** A prepared party with Ramuh equipped and zero progress in test spell $0A fought formation 436. One earned AP at the edited rate of 7 produced 7 progress for each of the four participating characters. The monster’s edited common and rare drop were both item $FB, making the test deterministic. The bag went from zero to one on return to the field. The clean control gave zero progress in that spell and no test item. A separate probe changed Leviathan’s displayed Flood rate from 2 to 7. Battle still awarded 2. Assigning Flood to Ramuh produced zero Flood progress. The editor protects the dedicated teaching slots and excludes the three special IDs from ordinary teaching selectors.

**Map music.** Loaded actual saves at the Dragon’s Den entrance (map 415) and Soul Shrine entrance (229). Both used song 57 in the control. Edited copies selected songs 6 and 7, respectively. The loaded map property, field current-song value and sound driver’s current-song value all agreed.

**Formation art.** Compared normal-orientation previews to Snes9x battle captures for Zurvan, Vilia, Kaiser Dragon and Omega Weapon. All 17,389 opaque pixels across those sprites landed at the measured positions and agreed within two levels per RGB channel. The preview decodes the active ROM, including the custom graphics pointers for the added enemies. Placement and sprite art were tested at rest. Special effects, animated states and background-rendered enemies have separate drawing paths.

## Retail conversion

- Compared each clean USA input, with and without a 512-byte copier header, against the independently built official v1.6.5 Regular image. Both revisions produced CRC32 `5ACCB7C3` and the reference SHA-256 above. Headered exports preserved all 512 prefix bytes.
- A combined retail edit changed all 255 item prices plus monster HP, loot, a monster name, an item name, a formation, Esper teaching, spell and summon values, two map fields, a field dialogue glyph and the internal title. The test set stale retail checksum words deliberately. Each complete converted file matched an independently constructed expectation on both revisions, including all intended mirrored writes and the regenerated checksum. Reopened copies accepted another edit. Both uniform retail padding conventions were exercised.
- Rejected edits to a battle reader, protected boss and name slots, item $FF, a Shrine map, an unrelated map flag, a dialogue pointer and a dialogue operand. Also rejected an active formation slot using a repurposed ID, a control code inserted into a glyph slot, an invalid ordinary Esper teaching ID and a populated unsupported expansion. A failed replacement preserved the previously open ROM.
- In Snes9x, loaded the same field state and triggered formation 436 in the clean Regular image and a Regular image built from edited retail. Monster $104's battle RAM showed 1,300 current and maximum HP in the control and 12,345 in the import. Both values appeared on frame 37 of the replay.

## Windows browser sign-off

On November 21, 2026, Windows Chrome 157 and Firefox 160 each passed all nine RC3 checks from the extracted editor using a clean USA v1.0 retail ROM. The release promotes that build to 0.3. Only version labels, documentation and the two reports differ from the tested archive.

| Browser | File used | Checks passed | Original report |
|---|---|---|---|
| Chrome 157 on Windows | USA v1.0 retail | 9 of 9 | [Chrome report](tests/reports/v0.3/FF6Tools-native-Chrome.json) |
| Firefox 160 on Windows | USA v1.0 retail | 9 of 9 | [Firefox report](tests/reports/v0.3/FF6Tools-native-Firefox.json) |

Both recorded the expected SHA-256 after the scripted edits, `f18ce0e68ea9a43f3bd3ae90a6a807f6090cf3b0c24e9088409c7852c1dcc4a0`. Each browser then downloaded its own edited ROM and reopened it after a full page reload. Each reopened file matched that browser’s export byte for byte. The reports record the individual export hashes. Separate automated tests cover USA v1.1 as described above.

RC3 records the SHA-256 of the actual download for the reopen step. With Bone Wrist set to 43,210 GP, 100 Defense and 100 Magic Defense, the exported bytes and the reported RC2 download matched exactly, including the header. The regression test exercises the preset and customized exports, a second export in the same session, a subsequent unsaved change, rejection of a stale download, and a successful retry with the matching bytes under a different filename. The normal editor also reopened the reported file and re-exported it byte for byte.

The automated Playwright suite is also included. It exercises additional record types and byte comparisons. Use a clean retail ROM to include the converter and interactive browser check in that run.
