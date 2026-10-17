# Builds the "Export" scene from the "Anatomy" scene (see load_source.py):
#   - keeps only real anatomical parts (drops labels .g, placeholders .j, landmarks .i/.t, variants "(...)")
#   - sorts every part into one of the app's systems
#   - converts curves (vessels, nerves, ducts) to tube meshes and bakes world transforms
#   - adds a Decimate modifier per object so each system stays within its triangle budget
#   - writes src/data/generated/parts-index.json (id -> name, system, group path, colour)
#     and public/data/descriptions.json (name -> intro text)
import bpy
import json
import os
import re
from mathutils import Vector

SRC = r"E:\body-anatomy\assets-src\z-anatomy\Startup.blend"
OUT_INDEX = r"E:\body-anatomy\public\data\parts-index.json"
OUT_DESC = r"E:\body-anatomy\public\data\descriptions.json"

# Triangle budget per app system (before mesh compression).
BUDGET = {
    "skeletal": 380_000,
    "muscular": 480_000,
    "nervous": 220_000,
    "cardiovascular": 160_000,
    "lymphatic": 40_000,
    "respiratory": 70_000,
    "digestive": 90_000,
    "urinary": 25_000,
    "endocrine": 12_000,
    "reproductive": 25_000,
}
MIN_TRIS_PER_PART = 160

VISCERAL_MAP = [
    ("Respiratory system", "respiratory"),
    ("Thoracic cavity", "respiratory"),
    ("Digestive system", "digestive"),
    ("Abdominopelvic cavity", "digestive"),
    ("Urinary system", "urinary"),
    ("Endocrine glands", "endocrine"),
    ("Genital systems", "reproductive"),
]
COLLECTION_MAP = {
    "1: Skeletal system": "skeletal",
    "3: Joints": "skeletal",
    "4: Muscular system": "muscular",
    "5: Cardiovascular system": "cardiovascular",
    "6: Lymphoid organs": "lymphatic",
    "7: Nervous system & Sense organs": "nervous",
}

src_scene = bpy.data.scenes["Anatomy"]
with bpy.context.temp_override(scene=src_scene, view_layer=src_scene.view_layers[0]):
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()


# Thin fascia sheets wrap whole limbs/trunk like a second skin and hide the muscles, so they are left out.
FASCIA = re.compile(r"fascia\b|fasciae of|intermuscular septum|investing", re.I)


def is_part(o):
    if o.type not in {"MESH", "CURVE"}:
        return False
    if re.search(r"\.(g|j|i|t)\d*$", o.name) or o.name.startswith("("):
        return False
    if FASCIA.search(o.name) and not re.search(r"muscle|tensor", o.name, re.I):
        return False
    if o.hide_get(view_layer=src_scene.view_layers[0]) or o.hide_viewport:
        return False
    return True


def group_path(o):
    names = []
    p = o.parent
    while p is not None:
        if p.name.endswith(".g"):
            names.append(p.name[:-2])
        p = p.parent
    return list(reversed(names))


def system_for(o, coll_name, path):
    if coll_name in COLLECTION_MAP:
        return COLLECTION_MAP[coll_name]
    if coll_name == "8: Visceral systems":
        for key, sys in VISCERAL_MAP:
            if key in path:
                return sys
    return None


def display_name(name):
    base = re.sub(r"\.\d{3}$", "", name)
    side = ""
    m = re.search(r"\.(l|r)$", base)
    if m:
        side = " (Left)" if m.group(1) == "l" else " (Right)"
        base = base[:-2]
    return base.strip(" '"), side


def slug(name):
    s = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return s or "part"


def colour(o):
    mat = o.active_material
    if mat is None:
        return None
    c = mat.diffuse_color
    return "#%02x%02x%02x" % tuple(int(max(0, min(1, v)) ** (1 / 2.2) * 255) for v in c[:3])


# Fresh export scene.
old = bpy.data.scenes.get("Export")
if old:
    for o in list(old.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.scenes.remove(old)
exp = bpy.data.scenes.new("Export")
sys_colls = {}
for sys in BUDGET:
    c = bpy.data.collections.new(f"sys_{sys}")
    exp.collection.children.link(c)
    sys_colls[sys] = c

parts = {}
used_ids = set()
skipped = 0
for coll in src_scene.collection.children:
    if coll.name not in COLLECTION_MAP and coll.name != "8: Visceral systems":
        continue
    for o in coll.all_objects:
        if not is_part(o):
            continue
        path = group_path(o)
        sys = system_for(o, coll.name, path)
        if sys is None:
            skipped += 1
            continue
        mesh = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        if len(mesh.polygons) == 0:
            bpy.data.meshes.remove(mesh)
            skipped += 1
            continue
        mesh.transform(o.matrix_world)
        if o.matrix_world.determinant() < 0:
            # Mirrored (left-side) parts come out inside-out once the mirror transform is baked in.
            mesh.flip_normals()
        mesh.materials.clear()
        mesh.validate(clean_customdata=False)
        base, side = display_name(o.name)
        pid = slug(base + ("_" + side[2] if side else ""))
        n = 2
        while pid in used_ids:
            pid = f"{slug(base)}_{n}"
            n += 1
        used_ids.add(pid)
        mesh.name = pid
        new = bpy.data.objects.new(pid, mesh)
        sys_colls[sys].objects.link(new)
        tris = sum(len(p.vertices) - 2 for p in mesh.polygons)
        parts[pid] = {
            "name": base + side,
            "baseName": base,
            "system": sys,
            "path": [g for g in path if g not in ("Visceral systems",)],
            "color": colour(o),
            "tris": tris,
            "isCurve": o.type == "CURVE",
        }

# Decimate to budget.
report = {}
for sys, coll in sys_colls.items():
    total = sum(parts[o.name]["tris"] for o in coll.objects)
    ratio = min(1.0, BUDGET[sys] / max(total, 1))
    final = 0
    for o in coll.objects:
        t = parts[o.name]["tris"]
        r = max(ratio, min(1.0, MIN_TRIS_PER_PART / max(t, 1)))
        if r < 0.98:
            mod = o.modifiers.new("decimate", "DECIMATE")
            mod.ratio = r
            mod.use_collapse_triangulate = True
        final += int(t * r)
    report[sys] = {"parts": len(coll.objects), "tris_before": total, "tris_after_est": final}

# Centre/bbox per part for labels and camera fly-to (in glTF Y-up metres: x, z, -y).
for o in exp.objects:
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    c = (lo + hi) / 2
    size = hi - lo
    parts[o.name]["center"] = [round(c.x, 4), round(c.z, 4), round(-c.y, 4)]
    parts[o.name]["size"] = [round(size.x, 4), round(size.z, 4), round(size.y, 4)]
    del parts[o.name]["tris"]

# Descriptions: intro paragraphs of Z-Anatomy's Wikipedia-derived texts.
wanted = {p["baseName"] for p in parts.values()} | {g for p in parts.values() for g in p["path"]}
with bpy.data.libraries.load(SRC, link=False) as (data_from, data_to):
    data_to.texts = [n for n in data_from.texts if n in wanted]
descriptions = {}
for t in data_to.texts:
    body = t.as_string()
    intro = body.split("\n==")[0]
    paras = [p.strip() for p in intro.split("\n") if p.strip()]
    paras = [p for p in paras if not (p.isupper() or p.endswith("/"))]
    text = " ".join(paras)
    text = re.sub(r"\[\d+\]", "", text)
    text = re.sub(r"\(\s*[,;]?\s*", "(", text).replace("()", "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > 1400:
        text = text[:1400].rsplit(". ", 1)[0] + "."
    descriptions[t.name] = text
    bpy.data.texts.remove(t)

os.makedirs(os.path.dirname(OUT_INDEX), exist_ok=True)
os.makedirs(os.path.dirname(OUT_DESC), exist_ok=True)
with open(OUT_INDEX, "w", encoding="utf-8") as f:
    json.dump(parts, f, ensure_ascii=False, separators=(",", ":"))
with open(OUT_DESC, "w", encoding="utf-8") as f:
    json.dump(descriptions, f, ensure_ascii=False, separators=(",", ":"))

print("skipped:", skipped, "parts:", len(parts), "descriptions:", len(descriptions))
for sys, r in report.items():
    print(f"{sys:15s} parts={r['parts']:5d} tris {r['tris_before']:>10,} -> ~{r['tris_after_est']:,}")
