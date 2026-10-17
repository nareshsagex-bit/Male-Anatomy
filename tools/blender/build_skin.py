# Generates the outer skin surface from the anatomy itself, so it wraps the inner layers exactly:
# muscles + bones + eyes/ears are merged, inflated a few mm, voxel-remeshed into one surface,
# inner cavity shells are dropped, then smoothed and decimated.
import bpy
import bmesh
import json
import re

OUT_INDEX = r"E:\body-anatomy\public\data\parts-index.json"
INFLATE = 0.005      # metres the skin sits outside the muscle layer
VOXEL = 0.004        # merge resolution (smaller = more facial/finger detail)
TARGET_TRIS = 110_000

exp = bpy.data.scenes["Export"]
vl = exp.view_layers[0]
SENSE = re.compile(r"eyeball|cornea|sclera|auricle|external ear|ear lobule|helix|antihelix|tragus", re.I)


def apply_modifiers(obj):
    with bpy.context.temp_override(scene=exp, view_layer=vl):
        dg = bpy.context.evaluated_depsgraph_get()
        dg.update()
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    bpy.data.meshes.remove(old)


def tri_count(mesh):
    return sum(len(p.vertices) - 2 for p in mesh.polygons)


sources = list(exp.collection.children["sys_muscular"].objects) + list(exp.collection.children["sys_skeletal"].objects)
sources += [o for o in exp.collection.children["sys_nervous"].objects if SENSE.search(o.name.replace("_", " "))]

bm = bmesh.new()
for o in sources:
    bm.from_mesh(o.data)
mesh = bpy.data.meshes.new("skin")
bm.to_mesh(mesh)
bm.free()
print(f"skin source: {len(sources)} parts, {tri_count(mesh):,} tris", flush=True)

coll = exp.collection.children.get("sys_skin") or bpy.data.collections.new("sys_skin")
if coll.name not in exp.collection.children:
    exp.collection.children.link(coll)
skin = bpy.data.objects.new("skin", mesh)
coll.objects.link(skin)

# 1. Inflate each source part, then fuse everything into one closed surface.
disp = skin.modifiers.new("inflate", "DISPLACE")
disp.direction = "NORMAL"
disp.mid_level = 0.0
disp.strength = INFLATE
rem = skin.modifiers.new("fuse", "REMESH")
rem.mode = "VOXEL"
rem.voxel_size = VOXEL
rem.use_smooth_shade = True
apply_modifiers(skin)
print(f"fused: {tri_count(skin.data):,} tris", flush=True)

# 2. Keep only the outer shell (largest connected piece); drop cavity linings.
bm = bmesh.new()
bm.from_mesh(skin.data)
bm.verts.ensure_lookup_table()
seen = set()
components = []
for v in bm.verts:
    if v.index in seen:
        continue
    seen.add(v.index)
    stack, comp = [v], []
    while stack:
        x = stack.pop()
        comp.append(x)
        for e in x.link_edges:
            y = e.other_vert(x)
            if y.index not in seen:
                seen.add(y.index)
                stack.append(y)
    components.append(comp)
components.sort(key=len, reverse=True)
keep = {v.index for v in components[0]}
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context="VERTS")
bm.to_mesh(skin.data)
bm.free()
print(f"shells: {len(components)}, kept largest: {tri_count(skin.data):,} tris", flush=True)

# 3. Smooth like skin (volume-preserving), then decimate to budget.
smooth = skin.modifiers.new("smooth", "LAPLACIANSMOOTH")
smooth.lambda_factor = 0.6
smooth.iterations = 6
smooth.use_volume_preserve = True
apply_modifiers(skin)
dec = skin.modifiers.new("decimate", "DECIMATE")
dec.ratio = min(1.0, TARGET_TRIS / max(tri_count(skin.data), 1))
dec.use_collapse_triangulate = True
apply_modifiers(skin)
for p in skin.data.polygons:
    p.use_smooth = True
print(f"skin final: {tri_count(skin.data):,} tris", flush=True)

# 4. Register in the parts index.
with open(OUT_INDEX, encoding="utf-8") as f:
    parts = json.load(f)
lo = [min(v.co[i] for v in skin.data.vertices) for i in range(3)]
hi = [max(v.co[i] for v in skin.data.vertices) for i in range(3)]
c = [(a + b) / 2 for a, b in zip(lo, hi)]
parts["skin"] = {
    "name": "Skin",
    "baseName": "Skin",
    "system": "skin",
    "path": ["Integumentary system"],
    "color": "#d9a48a",
    "isCurve": False,
    "center": [round(c[0], 4), round(c[2], 4), round(-c[1], 4)],
    "size": [round(hi[0] - lo[0], 4), round(hi[2] - lo[2], 4), round(hi[1] - lo[1], 4)],
}
with open(OUT_INDEX, "w", encoding="utf-8") as f:
    json.dump(parts, f, ensure_ascii=False, separators=(",", ":"))
