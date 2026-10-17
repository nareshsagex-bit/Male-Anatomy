# Lists what is inside Z-Anatomy's Startup.blend without loading it into the scene.
import bpy

SRC = r"E:\body-anatomy\assets-src\z-anatomy\Startup.blend"

with bpy.data.libraries.load(SRC, link=False) as (data_from, data_to):
    print("collections:", len(data_from.collections))
    print("objects:", len(data_from.objects))
    print("meshes:", len(data_from.meshes))
    print("materials:", len(data_from.materials))
    print("texts:", list(data_from.texts))
    print("COLLECTIONS:")
    for name in data_from.collections:
        print("  ", name)
