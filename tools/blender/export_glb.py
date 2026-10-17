# Exports each system collection of the "Export" scene to assets-src/models-raw/<system>.glb.
# Each collection is moved into the main (window/context) scene for its export, because running the
# glTF exporter against a secondary scene in background mode crashes Blender's depsgraph.
import bpy
import os

OUT_DIR = r"E:\body-anatomy\assets-src\models-raw"
os.makedirs(OUT_DIR, exist_ok=True)

exp = bpy.data.scenes["Export"]
main = bpy.context.scene
for o in list(main.objects):
    bpy.data.objects.remove(o, do_unlink=True)

for coll in list(exp.collection.children):
    system = coll.name.removeprefix("sys_")
    if not coll.objects:
        continue
    main.collection.children.link(coll)
    bpy.context.view_layer.update()
    path = os.path.join(OUT_DIR, f"{system}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=False,
        use_active_scene=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=False,
        export_normals=True,
        export_materials="NONE",
        export_animations=False,
        export_extras=False,
    )
    main.collection.children.unlink(coll)
    print(f"exported {system}: {os.path.getsize(path) / 1e6:.1f} MB", flush=True)
