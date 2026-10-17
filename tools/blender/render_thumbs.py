# Renders a small framed thumbnail of each system for the layer cards -> public/thumbs/<system>.png
# Run: blender -b assets-src/anatomy_export.blend --python tools/blender/render_thumbs.py
import bpy
import math
import os
from mathutils import Vector

OUT = r"E:\body-anatomy\public\thumbs"
os.makedirs(OUT, exist_ok=True)

COLORS = {
    "skin": (0.80, 0.55, 0.45),
    "muscular": (0.62, 0.16, 0.13),
    "skeletal": (0.90, 0.86, 0.76),
    "nervous": (0.92, 0.76, 0.30),
    "cardiovascular": (0.78, 0.17, 0.15),
    "respiratory": (0.86, 0.55, 0.57),
    "digestive": (0.80, 0.52, 0.42),
    "lymphatic": (0.45, 0.72, 0.40),
    "urinary": (0.60, 0.25, 0.22),
    "endocrine": (0.72, 0.45, 0.60),
    "reproductive": (0.80, 0.58, 0.52),
}
# Systems that span the whole body are framed on the upper body, like a portrait.
UPPER_BODY = {"skin", "muscular", "skeletal", "nervous", "cardiovascular", "lymphatic"}

exp = bpy.data.scenes["Export"]
scene = bpy.context.scene
for o in list(scene.objects):
    bpy.data.objects.remove(o, do_unlink=True)

scene.render.engine = "BLENDER_WORKBENCH"
shading = scene.display.shading
shading.light = "STUDIO"
shading.color_type = "SINGLE"
shading.show_cavity = True
shading.cavity_type = "BOTH"
shading.show_specular_highlight = True
scene.render.resolution_x = 320
scene.render.resolution_y = 224
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"

cam_data = bpy.data.cameras.new("thumb")
cam_data.type = "ORTHO"
cam = bpy.data.objects.new("thumb", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.rotation_euler = (math.radians(90), 0, 0)

for coll in list(exp.collection.children):
    system = coll.name.removeprefix("sys_")
    scene.collection.children.link(coll)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in coll.objects for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    if system in UPPER_BODY:
        lo.z, hi.z = 1.05, 1.75
        lo.x, hi.x = -0.3, 0.3
    centre = (lo + hi) / 2
    width, height = hi.x - lo.x, hi.z - lo.z
    aspect = scene.render.resolution_x / scene.render.resolution_y
    cam_data.ortho_scale = max(width, height * aspect) * 1.12
    cam.location = (centre.x, lo.y - 2.0, centre.z)
    shading.single_color = COLORS.get(system, (0.8, 0.8, 0.8))
    scene.render.filepath = os.path.join(OUT, f"{system}.png")
    bpy.ops.render.render(write_still=True)
    scene.collection.children.unlink(coll)
    print("thumb", system, flush=True)
