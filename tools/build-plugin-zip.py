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

import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "umoya-elementor-widgets")
OUT = os.path.join(ROOT, "umoya-elementor-widgets.zip")
TOP = "umoya-elementor-widgets"          # required top-level folder in the zip
MAIN = "umoya-elementor-widgets.php"     # WP looks for TOP/MAIN

# Never ship editor/OS cruft inside a plugin
SKIP_DIRS = {".git", ".svn", "__pycache__", "node_modules", ".idea", ".vscode"}
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

    size_kb = os.path.getsize(OUT) / 1024
    print(f"Built {os.path.basename(OUT)}")
    print(f"  entries      : {count}")
    print(f"  size         : {size_kb:.1f} KB")
    print(f"  separators   : forward slash only  OK")
    print(f"  entry point  : {TOP}/{MAIN}  present")
    print(f"  top-level    : single folder {TOP!r}  OK")


if __name__ == "__main__":
    main()
