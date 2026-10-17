# Headless build of all anatomy assets. Run with:
#   blender -b --factory-startup --python tools/blender/run_build.py
# Steps: load Z-Anatomy systems -> build export scene + index -> build skin -> export GLBs -> save .blend for inspection.
import bpy
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
STEPS = ["load_source.py", "build_export.py", "build_skin.py", "export_glb.py"]
only = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

for step in STEPS:
    if only and step not in only and step != "load_source.py":
        continue
    start = time.time()
    print(f"==> {step}", flush=True)
    path = os.path.join(HERE, step)
    with open(path, encoding="utf-8") as f:
        exec(compile(f.read(), path, "exec"), {"__name__": "__main__"})
    print(f"<== {step} ({time.time() - start:.0f}s)", flush=True)

out = os.path.join(HERE, "..", "..", "assets-src", "anatomy_export.blend")
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(out), compress=True)
print("saved", os.path.abspath(out), flush=True)
