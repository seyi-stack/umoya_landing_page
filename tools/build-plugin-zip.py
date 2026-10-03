#!/usr/bin/env python3
"""
Umoya — build a WordPress-installable plugin zip.

WHY THIS EXISTS
---------------
Do NOT use PowerShell's `Compress-Archive` for this. On Windows PowerShell 5.1
it writes entry names with BACKSLASH separators:

    umoya-elementor-widgets\\includes\\class-submissions.php

The ZIP spec (APPNOTE 4.4.17.1) requires forward slashes. Linux/WordPress does
not treat "\\" as a directory separator, so the archive extracts into mangled
flat filenames and WordPress reports:

    Plugin file does not exist.

This script writes correct forward-slash entries, so the plugin installs and
network-activates normally.

Usage:  python tools/build-plugin-zip.py
Output: umoya-elementor-widgets.zip  (single top-level folder, as WP expects)
"""

import json
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "umoya-elementor-widgets")
OUT = os.path.join(ROOT, "umoya-elementor-widgets.zip")
TOP = "umoya-elementor-widgets"          # required top-level folder in the zip
MAIN = "umoya-elementor-widgets.php"     # WP looks for TOP/MAIN

# Never ship editor/OS cruft inside a plugin.
# `.verify` holds the widget compiler's fidelity-check artefacts (a bare template
# per section plus its expected output). They are build scratch, not runtime.
SKIP_DIRS = {".git", ".svn", "__pycache__", "node_modules", ".idea", ".vscode", ".verify"}
SKIP_FILES = {".DS_Store", "Thumbs.db", "desktop.ini"}


def main():
    if not os.path.isdir(SRC):
        sys.exit(f"ERROR: source folder not found: {SRC}")
    if not os.path.isfile(os.path.join(SRC, MAIN)):
        sys.exit(f"ERROR: main plugin file missing: {os.path.join(SRC, MAIN)}")

    if os.path.exists(OUT):
        os.remove(OUT)

    count = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for dirpath, dirnames, filenames in os.walk(SRC):
            dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
            for name in sorted(filenames):
                if name in SKIP_FILES:
                    continue
                full = os.path.join(dirpath, name)
                rel = os.path.relpath(full, SRC)
                # Force forward slashes — this is the whole point of the script
                arcname = TOP + "/" + rel.replace(os.sep, "/")
                zf.write(full, arcname)
                count += 1

    # ---- verify the archive we just wrote ----
    with zipfile.ZipFile(OUT) as zf:
        names = zf.namelist()
        bad = [n for n in names if "\\" in n]
        if bad:
            sys.exit(f"ERROR: {len(bad)} entries still contain backslashes, e.g. {bad[0]}")
        if f"{TOP}/{MAIN}" not in names:
            sys.exit(f"ERROR: {TOP}/{MAIN} is not in the archive")
        # every entry must sit under exactly one top-level folder
        tops = {n.split("/")[0] for n in names}
        if tops != {TOP}:
            sys.exit(f"ERROR: expected one top-level folder {TOP!r}, found {sorted(tops)}")
        broken = zf.testzip()
        if broken:
            sys.exit(f"ERROR: corrupt entry: {broken}")

        # Every widget the manifest registers must ship whole. The plugin skips
        # a widget whose class file is missing without a word, which looks
        # exactly like a widget vanishing from the panel.
        manifest = json.loads(zf.read(f"{TOP}/includes/sections/index.json"))
        missing = []
        expected = set()
        for key, section in manifest.items():
            files = [section.get("widget_file"), section.get("template"), f"includes/sections/{key}.json"]
            files += [(section.get("style") or {}).get("file"), (section.get("script") or {}).get("file")]
            for rel in filter(None, files):
                expected.add(rel)
                if f"{TOP}/{rel}" not in names:
                    missing.append(f"{key}: {rel}")
        if missing:
            sys.exit("ERROR: widgets registered without their files:\n  " + "\n  ".join(missing))

        # Generated files no widget uses any more are dead weight, and a sign the
        # plugin folder holds output from an older build.
        generated = ("widgets/", "templates/sections/", "assets/css/sections/", "assets/js/sections/")
        orphans = sorted(
            n[len(TOP) + 1:] for n in names
            if n[len(TOP) + 1:].startswith(generated) and not n.endswith("/") and n[len(TOP) + 1:] not in expected
        )

    size_kb = os.path.getsize(OUT) / 1024
    print(f"Built {os.path.basename(OUT)}")
    print(f"  entries      : {count}")
    print(f"  size         : {size_kb:.1f} KB")
    print(f"  separators   : forward slash only  OK")
    print(f"  entry point  : {TOP}/{MAIN}  present")
    print(f"  top-level    : single folder {TOP!r}  OK")
    print(f"  widgets      : {len(manifest)} registered, every file present  OK")
    if orphans:
        print(f"  WARNING      : {len(orphans)} generated file(s) no widget uses:")
        for orphan in orphans:
            print(f"                 {orphan}")


if __name__ == "__main__":
    main()
