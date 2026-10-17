# Renders quick Workbench previews of each exported system (front view) for visual checks.
# Run: blender -b assets-src/anatomy_export.blend --python tools/blender/render_preview.py -- [system ...]
import bpy
import math
import os
import sys

OUT = r"E:\body-anatomy\assets-src\previews"
os.makedirs(OUT, exist_ok=True)
only = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

exp = bpy.data.scenes["Export"]
scene = bpy.context.scene
for o in list(scene.objects):
    bpy.data.objects.remove(o, do_unlink=True)

scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "SINGLE"
scene.display.shading.single_color = (0.85, 0.7, 0.62)
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = "BOTH"
scene.render.resolution_x = 900
scene.render.resolution_y = 1400
scene.render.film_transparent = False

cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

VIEWS = {"front": (0, -4, 0.85, 90, 0), "side": (4, 0, 0.85, 90, 90), "face": (0, -2, 1.6, 90, 0)}

for coll in list(exp.collection.children):
    system = coll.name.removeprefix("sys_")
    if only and system not in only:
        continue
    scene.collection.children.link(coll)
    bpy.context.view_layer.update()
    for view, (x, y, z, rx, rz) in VIEWS.items():
        if view == "face" and system not in ("skin", "muscular", "skeletal"):
            continue
        cam.location = (x, y, z)
        cam.rotation_euler = (math.radians(rx), 0, math.radians(rz))
        cam_data.ortho_scale = 0.45 if view == "face" else 1.95
        scene.render.filepath = os.path.join(OUT, f"{system}_{view}.png")
        bpy.ops.render.render(write_still=True)
    scene.collection.children.unlink(coll)
    print("rendered", system, flush=True)
