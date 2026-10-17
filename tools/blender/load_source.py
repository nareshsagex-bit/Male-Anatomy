# Appends Z-Anatomy's system collections into a fresh "Anatomy" scene and reports their structure.
import bpy

SRC = r"E:\body-anatomy\assets-src\z-anatomy\Startup.blend"
SYSTEMS = [
    "1: Skeletal system",
    "2: Muscular insertions",
    "3: Joints",
    "4: Muscular system",
    "5: Cardiovascular system",
    "6: Lymphoid organs",
    "7: Nervous system & Sense organs",
    "8: Visceral systems",
]

scene = bpy.data.scenes.get("Anatomy") or bpy.data.scenes.new("Anatomy")
if bpy.context.window is not None:
    bpy.context.window.scene = scene

if not any(c.name in SYSTEMS for c in scene.collection.children):
    with bpy.data.libraries.load(SRC, link=False) as (data_from, data_to):
        data_to.collections = [n for n in SYSTEMS if n in data_from.collections]
    for coll in data_to.collections:
        scene.collection.children.link(coll)


def stats(coll):
    objs = coll.all_objects
    meshes = [o for o in objs if o.type == "MESH"]
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    types = {}
    for o in objs:
        types[o.type] = types.get(o.type, 0) + 1
    return len(meshes), tris, types


for coll in scene.collection.children:
    n, tris, types = stats(coll)
    print(f"{coll.name}: meshes={n} tris={tris:,} types={types}")
    for child in coll.children:
        cn, ctris, _ = stats(child)
        print(f"    {child.name}: meshes={cn} tris={ctris:,}")
