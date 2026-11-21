# Source and license

FF6Tools is by everything8215 and contributors. Upstream source and documentation are available at https://github.com/everything8215/ff6tools.

The three files in **vendor/** ending in .js are unmodified copies of upstream **rom/gfx.js**, **rom/romtools.js**, and **rom/rom-observer.js**. The original upstream README is included there, with its author and contributor credits. Field metadata and static lookup labels in **profile.js** are adapted from upstream **ff6/ff3u-sfc.json**. ROM-dependent record names are read from the user's file.

**2026-11-21.** This independent SNES Advance edition adds the Regular-specific layout, per-field selection lists, import and export, mirror handling, name and wearable-mask editing, undo tracking, SNES formation rendering, local user interface and tests. Formation rendering uses the layout documented by upstream ff6-battle.js and the Regular ROM. The source and modified definitions are distributed under version 3 of the GNU General Public License. The complete license is included in **COPYING**. There is no warranty as described in the license.

The editor's retail importer and its tests were added on 2026-11-21. The deltas in **retail-data.js** derive from the SNES Advance v1.6.5 Regular patches for US v1.0 and v1.1. **tools/build-retail-import.py** reproduces them from the release and user-supplied reference ROMs. SNES Advance and its contributors are credited in the original release at https://www.romhacking.net/hacks/10315/. The archive includes patch data and editor source. A game ROM must be supplied by the user.

**2026-11-21, editor 0.4 preview.** Additional work includes monster AI assembly and storage, field and world tile painting, rectangle selection, map object and palette editing, and the Regular field-dialogue editor. The SNES tile interpretation follows upstream **ff6-map.js** and **ff6-map-layer.js**. The encoding tables, command labels and descriptions of original record fields derive from **ff6/ff3u-sfc.json**. The source-generation script names the pinned upstream revision.

**2026-11-21, editor 0.5 preview.** New work includes room directories, event assemblers, authored NPC event forwarders, field and world rules, graphics imports and editable animation resources and frames. Field command names and animation labels derive from the pinned upstream FF6Tools definition. Battle event names and interpretations of native readers were checked against everything8215’s [Final Fantasy VI disassembly](https://github.com/everything8215/ff6). The package includes the editor’s complete local source and GPLv3 license. Users supply their own ROM.

**Editor 0.6 preview.** This edition adds rectangular PNG import, SNES palette quantization, shared-ink preservation, a destination preview and grouped graphics/palette history. It uses FF6Tools’ existing color, compression and ROM action facilities.

**Editor 0.7.** The integrated map workspace reads Regular field objects, composites native layers and renders ordinary NPC poses. Layout, layer order, NPC frames and event properties follow the original FF6Tools FFVI map editor and SNES definition. The workspace, event inspector, region compositor, interaction handlers and test additions are supplied under GPLv3.
