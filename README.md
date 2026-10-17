# Anatomy Nexus

A 3D human anatomy explorer that runs in the browser. It opens on a full body, and you peel it layer by layer: skin → muscles → skeleton, plus eight organ systems. Click any structure to see its name, where it sits in the anatomy, and a description. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the design.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## What's in the app

- **Layers**: the cards on the left, or the vertical **Peel** slider, dissolve the outer layers away.
- **Organ systems**: opening one brings it to the front and shows the skeleton faintly for context.
- **Click** a part to select it and fly the camera to it. **Isolate** shows only that part. **Hide part** removes it.
- **Key structures**: entries such as *Heart*, *Brain* or *Deltoid muscle* select every part of that group.
- **X-ray**: makes the outer layers see-through. **Labels** pins names on the key structures.
- **Explode**: lays every system out side by side. Click one to bring it back.
- **Quality** (top right): turns post-processing (ambient occlusion, bloom) on or off for weaker GPUs.

## 3D asset pipeline

The models come from [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) (CC BY-SA 4.0). Blender scripts process them headlessly:

| Step | Script | Output |
|---|---|---|
| Load the 8 system collections from `Startup.blend` | `tools/blender/load_source.py` | "Anatomy" scene |
| Keep the real parts, sort them into 10 systems, convert curves to tubes, fix mirrored normals, decimate to budget, write the index and descriptions | `tools/blender/build_export.py` | `public/data/parts-index.json`, `public/data/descriptions.json` |
| Generate the skin by fusing, inflating and smoothing muscles and bones | `tools/blender/build_skin.py` | `skin` part |
| Export one GLB per system | `tools/blender/export_glb.py` | `assets-src/models-raw/*.glb` |
| Meshopt compression | `tools/optimize.mjs` | `public/models/*.glb` (≈12 MB total) |
| Card thumbnails | `tools/blender/render_thumbs.py` | `public/thumbs/*.png` |

To rebuild, put `Startup.blend` from `Z-Anatomy.zip` in `assets-src/z-anatomy/`, then run:

```bash
npm run assets:build && npm run assets:optimize && npm run assets:thumbs
```

`tools/blender/bl.mjs <script.py>` sends a script to a running Blender with the MCP add-on (port 9876). Use it for small, interactive jobs. The full build runs headless because it is too heavy for the live UI.

## Credits

3D anatomy: Z-Anatomy, based on BodyParts3D © The Database Center for Life Science, CC BY-SA 4.0. Descriptions: Wikipedia via Z-Anatomy, CC BY-SA. This app is for education, not medical advice.
