# Human Anatomy 3D Explorer — Implementation Plan

> Status: **Approved, first build done (2026-10-17).** Phases 0–5 are built, and parts of 6–7 are done. See "Build status" below.

## Build status

| Phase | State | Notes |
|---|---|---|
| 0. Setup | ✅ | Vite + React 19 + TS, Tailwind 4, R3F 9, drei, postprocessing, Zustand, Framer Motion |
| 1. Asset pipeline | ✅ | Headless Blender scripts in `tools/blender/`; 2,745 parts in 11 GLBs, ≈12 MB after Meshopt |
| 2. 3D core | ✅ | Lighting, platform ring, camera presets, auto-rotate |
| 3. Layer breakdown | ✅ | Dissolve peel shader, peel slider, per-tissue procedural materials |
| 4. Interaction + info | ✅ | Hover tooltip, click select, fly-to, isolate, hide, x-ray, part and group info panels |
| 5. Exploded view + labels | ✅ | Line-up of 11 systems with floating names; labels mode for key structures |
| 6. Content | 🟡 | System facts written by hand; 1,547 part descriptions taken automatically from Z-Anatomy/Wikipedia |
| 7. Polish | 🟡 | Quality toggle and responsive layout done; accessibility pass and dark theme still to do |
| 8. Deploy | ⬜ | Not started |

**Changes from the original plan**
- **Search removed** at your request.
- **Skin is generated from the anatomy itself** in Blender: muscles and bones are fused, inflated and smoothed. This replaces MakeHuman, so the skin lines up exactly with the inner layers.
- **Fascia sheets are excluded.** Z-Anatomy's fascia wraps the limbs like a second skin and hid the muscles.
- **The skeleton layer shows only the compact internal organs.** Vessels, nerves and lymph appear when you open their own system.
- **Key structures can be groups**, such as Heart (17 parts) or Brain. Selecting one highlights every part in it.
- **System data lives in `src/data/systems.ts`** (typed) instead of JSON. The parts index is generated into `public/data/`.

---

## 1. Goal

A browser-based, realistic 3D human body that you can rotate and inspect from every direction. It opens on a complete body (skin). From a side list you "break it down" layer by layer into its systems, such as muscles, skeleton, organs, nerves and vessels. Every system and every part has its name and info, shown in a clean dashboard layout like the *Car Nexus* reference.

### What we take from each reference

| Reference | What we use from it |
|---|---|
| **Image 1/2 — "Complete Human Anatomy"** | The layering idea: skin → muscles → skeleton → organs, with each system named. An **Exploded / Line-up view** that places the systems side by side with floating 3D labels ("Cardiovascular System ▸", "Skeletal System ▸"…). Realistic materials (wet-looking muscle fibres, ivory bone, glossy organs). |
| **Image 3 — "Car Nexus" UI** | The page layout: a left list of selectable cards, a central hero viewer with breadcrumb + large serif title + short description + a glowing platform ring under the model, a right **Specifications** panel with stat bars, a **Highlights** panel, stat tiles along the bottom, and primary/secondary action buttons. Light theme, red accent, spaced uppercase labels. |

---

## 2. Feature Scope

### 2.1 Core (MVP)
1. **Full 3D viewer**: orbit (rotate 360°), zoom and pan with mouse, touch and keyboard. Preset camera buttons: Front / Back / Left / Right / Top.
2. **Starts with a simple full body**: a realistic skin and body surface standing on the platform ring, rotating slowly while idle.
3. **Layer breakdown (the main feature)**, chosen from the left list:
   - Layer 1 — **Integumentary** (skin)
   - Layer 2 — **Muscular** system
   - Layer 3 — **Skeletal** system
   - Layer 4 — **Organs**: Respiratory, Digestive, Cardiovascular (heart + major vessels), Nervous (brain, spinal cord, nerves), Lymphatic, Urinary, Endocrine, Reproductive
   - Choosing a layer **animates** the change: outer layers fade or dissolve away, so you see a peeling effect rather than a hard switch.
4. **Depth slider ("peel")**: a vertical slider that gradually strips layers from skin down to skeleton. This is an alternative to clicking cards.
5. **Click any part → info**: the part is highlighted with an outline and glow, the camera flies to frame it, and the info panel updates (name, Latin name, system, description, key facts).
6. **Hover tooltip**: the part name follows the cursor.
7. **Labels mode**: 3D labels with leader lines pinned to the major structures, which stay readable while rotating.
8. **Visibility tools**: Hide part, Isolate part, X-ray (make the other systems semi-transparent), Reset view.
9. **Exploded / Line-up view**: a recreation of reference image 1. Every system is laid out side by side in 3D with floating system names. Clicking one brings it back to centre.

### 2.2 Nice-to-have (Phase 5+; your call)
- Organ **sub-breakdown**: for example, Heart → chambers and valves, Brain → lobes.
- Simple animations: beating heart, breathing lungs.
- Quiz mode ("Click the tibia"), with the progress bar reused as in "Expedition Log 15/50".
- Male/Female model toggle.
- Cross-section clipping plane (slice the body).
- Bookmarks / shareable URL for a view (`?system=skeletal&part=femur`).

---

## 3. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite + React 18 + TypeScript** | Fast dev server, typed codebase. |
| 3D | **three.js** via **@react-three/fiber** | The standard for WebGL in React. |
| 3D helpers | **@react-three/drei** | OrbitControls/CameraControls, `useGLTF`, `Html` labels, `Environment` HDRI, `Bounds`, `Outlines`, `ContactShadows`. |
| Post-processing | **@react-three/postprocessing** | SSAO (depth), selective Bloom (highlight glow), Outline, SMAA, tone mapping. |
| Raycasting perf | **three-mesh-bvh** | Fast, precise click/hover on high-poly meshes. |
| Camera | **camera-controls** (via drei `CameraControls`) | Smooth fly-to-part transitions. |
| State | **Zustand** | Selected part, active layer, visibility map, view mode. |
| UI animation | **Framer Motion** | Panel/card transitions like the reference. |
| Styling | **Tailwind CSS** + CSS variables | Fast to build the Car Nexus look. |
| Fonts | *Playfair Display* (serif title), *Rajdhani* or *Barlow* (spaced uppercase labels), *Inter* (body) | Matches reference image 3. |
| Asset pipeline | **Blender 4.x** + **gltf-transform CLI** | Export, decimate and compress models (Draco/Meshopt + KTX2 textures). |

---

## 4. 3D Assets (the most important decision)

How realistic the result looks depends mostly on the models. The options:

| Option | Detail | Licence | Realism | Cost |
|---|---|---|---|---|
| **A. Z-Anatomy** (recommended) | Open-source atlas built on BodyParts3D. About 5,000+ named structures across all systems, already split and labelled in Blender. | CC BY-SA 4.0 (attribution required) | Accurate geometry, plain materials, so **we add realistic materials ourselves** | Free |
| B. BodyParts3D (raw) | The same source data as Z-Anatomy, but less organised. | CC BY-SA 2.1 JP | Same as A | Free |
| C. Sketchfab / CGTrader paid model (for example the one in image 1) | Fully textured, very realistic. | Paid, and per-model licence terms vary (check web-use rights) | Highest | Roughly $100–$500+ |
| D. MakeHuman / MPFB | Used only for the **outer skin body** (layer 1). | CC0 | Good skin | Free |

**Recommendation:** use **A + D**. Z-Anatomy supplies the internal systems (accurately named, which is what the info feature needs), and MakeHuman supplies a nicer skin shell aligned to the same skeleton. We reach realism through custom PBR materials (Section 5). If you later buy a paid model (C), the code stays the same; only the GLB files change.

### Asset pipeline (Phase 1)
1. Open Z-Anatomy in Blender. Delete the bits we don't need (tiny ligaments and other micro-structures in the MVP).
2. Group the meshes into **one GLB per system**: `skin.glb`, `muscular.glb`, `skeletal.glb`, `nervous.glb`, `cardiovascular.glb`, `respiratory.glb`, `digestive.glb`, `lymphatic.glb`, `urinary.glb`, `endocrine.glb`, `reproductive.glb`.
3. Make sure **every mesh name = a stable part ID** (for example `femur_L`, `biceps_brachii_R`). The info database keys off these names.
4. Decimate to a budget (Section 8), apply transforms, align all systems to a shared origin and scale (1 unit = 1 m).
5. Bake ambient occlusion and normal/detail maps (muscle fibre striations, bone porosity) where useful.
6. Run `gltf-transform optimize` to apply **Meshopt** geometry compression and **KTX2/Basis** textures.
7. A script exports a `parts-index.json` (mesh name → system, bounding box centre for labels).

---

## 5. Making It Look Realistic

- **Lighting:** a studio HDRI environment (`<Environment>`) plus a soft key light, a rim light (for the backlit edges seen in image 1) and **ContactShadows** on the platform.
- **Tone mapping:** ACES Filmic, sRGB output, physically-correct lights.
- **Materials** (`MeshPhysicalMaterial`, tuned per system):
  - *Skin*: subsurface-like look through `sheen` and `transmission`/thickness, a light roughness map, warm tint.
  - *Muscle*: deep red, a striated normal map along the fibre direction, slight `clearcoat` for the wet look, white tendon areas via a vertex-colour or mask texture.
  - *Bone*: ivory and off-white, high roughness, cavity AO for porosity.
  - *Organs*: glossy `clearcoat`, organ-specific tints (pink lungs, brown-red liver, beige intestines).
  - *Vessels/Nerves*: arteries red, veins blue, nerves yellow, lymph green. Light emissive tint so they read clearly, as in image 1.
- **Post-processing:** SSAO (depth between muscles), selective Bloom (only on the selected part), Outline on hover/selection, SMAA anti-aliasing.
- **Layer transitions:** a custom **dissolve shader** (noise-based alpha cutoff with a glowing edge) for peeling layers. This looks far better than a plain fade.
- **Quality toggle:** High / Medium / Low, which switches post-FX and texture size for weaker GPUs and phones.

---

## 6. UI / Layout (Car Nexus style)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ◉ ANATOMY NEXUS             [ SCAN ACTIVE ●●● ]                    ☰       │
│   STRUCTURE · SYSTEM · FUNCTION                                               │
├──────────────┬────────────────────────────────────────────┬───────────────────┤
│ LAYERS       │ BODY / SKELETAL / FEMUR                    │ │ SPECIFICATIONS  │
│ ┌──────────┐ │                                            │  Bones     206 ▬▬ │
│ │[img] L1  │ │ SKELETAL                                   │  % body wt 15% ▬  │
│ │ SKIN     │ │ SYSTEM            (big serif, red word)    │  Largest  Femur   │
│ └──────────┘ │ FRAMEWORK · SUPPORT · PROTECTION           │  Smallest Stapes  │
│ ┌──────────┐ │ Short description paragraph…               │                   │
│ │[img] L2  │ │ (● Location chip)                          │ │ KEY STRUCTURES  │
│ │ MUSCULAR │ │                                            │  ▸ Skull       →  │
│ └──────────┘ │          [  3D CANVAS – rotatable  ]       │  ▸ Spine       →  │
│ ┌──────────┐ │          (body on glowing ring)     ▲ peel │  ▸ Pelvis      →  │
│ │[img] L3  │ │                                     │ slid │  [ VIEW ALL → ]  │
│ │ SKELETAL │ │  [Front][Back][Left][Right][Top]    ▼      │                   │
│ └──────────┘ │                                            │                   │
│   … organs   │ ┌────────┐ ┌────────┐ ┌────────┐           │                   │
│              │ │BONES   │ │JOINTS  │ │MARROW  │  stat tiles│                   │
│ EXPLORED     │ │206     │ │~360    │ │~4% wt  │           │                   │
│ 15 / 50 ▬▬   │ └────────┘ └────────┘ └────────┘           │                   │
│              │ [ ISOLATE ] [ ◉ EXPLORE / EXPLODE ] [ X-RAY ]                  │
└──────────────┴────────────────────────────────────────────┴───────────────────┘
```

- **Left panel (Layers list):** cards like the car list, each with a rendered thumbnail of that system, the layer number, the name and a sub-label. The active card gets a red border and soft red tint.
- **Centre:** breadcrumb (`BODY / SKELETAL / FEMUR`), large serif title (second word in red), spaced subtitle, description, location chip. The 3D canvas sits behind/below with the **glowing ring platform**. Stat tiles and three action buttons are at the bottom (the primary one filled red).
- **Right panel:** **Specifications** with stat bars (facts about the selected system/part) and a **Key Structures** list (click to fly the camera to it, like "Highlights & Missions").
- **Context switch:** when nothing is selected, panels show **system** info. After you click a part, they switch to **part** info, with a back arrow to return.
- **Exploded view:** replaces the centre with the full-width line-up from image 1.
- **Responsive:** on tablets and phones the side panels become bottom sheets/drawers, and the canvas goes full screen.
- **Theme:** light (as in the reference) by default, with an optional dark mode that suits the image 1 look.

---

## 7. Data Model

`src/data/systems.json`: one entry per system:
```json
{
  "id": "skeletal",
  "layer": 3,
  "name": "Skeletal System",
  "tagline": "Framework · Support · Protection",
  "description": "The skeletal system provides the body's structural framework…",
  "model": "/models/skeletal.glb",
  "color": "#EDE6D6",
  "specs": [
    { "label": "Bones (adult)", "value": "206", "bar": 0.8 },
    { "label": "Share of body weight", "value": "~15%", "bar": 0.15 }
  ],
  "stats": [ { "label": "Joints", "value": "~360" } ],
  "keyStructures": ["skull", "vertebral_column", "pelvis", "femur_L"]
}
```

`src/data/parts.json`: one entry per clickable structure (key = mesh name from the GLB):
```json
{
  "femur_L": {
    "name": "Femur (Left)",
    "latin": "Os femoris",
    "system": "skeletal",
    "region": "Lower limb · Thigh",
    "description": "The longest and strongest bone in the human body…",
    "facts": [ { "label": "Length", "value": "~48 cm" } ],
    "aliases": ["thigh bone"]
  }
}
```

- **MVP content target:** all systems + roughly **60–100 key structures** with full text (major bones, major muscle groups, every main organ). All other meshes still show at least their name, taken from the Z-Anatomy label.
- Content is written from standard anatomy references (Gray's Anatomy, OpenStax Anatomy & Physiology, which is CC BY) and reviewed for accuracy.

---

## 8. Performance Budget

| Item | Target |
|---|---|
| Initial load (skin + UI) | < 5 MB, interactive in < 3 s on broadband |
| Each system GLB (compressed) | 2–8 MB, **lazy-loaded** when first selected, with a progress indicator |
| Triangles on screen | ≤ 1.5 M desktop High, ≤ 400 k mobile |
| Frame rate | 60 fps desktop, ≥ 30 fps mid-range phone |
| Textures | KTX2, 2K max (1K on Low quality) |

Techniques: lazy loading per system, Meshopt + KTX2, BVH raycasting, `frameloop="demand"` when idle, a background preload of the next likely layer, and disposal of unused GPU resources.

---

## 9. Project Structure

```
body-anatomy/
├── public/
│   ├── models/            # *.glb per system (output of asset pipeline)
│   ├── hdri/              # studio environment map
│   └── thumbs/            # rendered card thumbnails per system
├── tools/
│   ├── blender/           # export_systems.py (Blender script)
│   └── optimize.mjs       # gltf-transform batch optimise + parts-index export
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── store/useAnatomyStore.ts      # Zustand: layer, selection, visibility, mode
│   ├── data/systems.json
│   ├── data/parts.json
│   ├── three/
│   │   ├── Scene.tsx                 # Canvas, lights, env, post-FX
│   │   ├── BodyModel.tsx             # loads & composes system GLBs
│   │   ├── SystemLayer.tsx           # one system: materials, dissolve, events
│   │   ├── materials/                # skin, muscle, bone, organ, vessel materials
│   │   ├── shaders/dissolve.ts       # layer peel shader
│   │   ├── Platform.tsx              # glowing ring
│   │   ├── Labels3D.tsx              # leader-line labels
│   │   ├── ExplodedView.tsx          # line-up layout of systems
│   │   └── CameraRig.tsx             # presets + fly-to-part
│   ├── ui/
│   │   ├── TopBar.tsx
│   │   ├── LayerList.tsx  / LayerCard.tsx
│   │   ├── HeroInfo.tsx              # breadcrumb, title, description
│   │   ├── SpecsPanel.tsx            # stat bars
│   │   ├── KeyStructures.tsx
│   │   ├── StatTiles.tsx
│   │   ├── ActionBar.tsx             # Isolate / Explode / X-ray
│   │   ├── DepthSlider.tsx
│   │   ├── ViewPresets.tsx
│   │   └── HoverTooltip.tsx
│   └── styles/index.css
├── IMPLEMENTATION_PLAN.md
└── package.json
```

---

## 10. Phased Delivery

| Phase | Deliverable | You can see/verify |
|---|---|---|
| **0. Setup** | Vite + React + TS + Tailwind + R3F scaffold, fonts, theme tokens, empty three-column layout. | The app runs locally with the dashboard shell. |
| **1. Asset pipeline** | Download Z-Anatomy and MakeHuman. Write a Blender export script, an optimise script, the per-system GLBs and `parts-index.json`. | GLBs load in a test viewer; sizes match the budget. |
| **2. 3D core** | Scene, lighting, HDRI, platform ring, skin body, orbit controls, view presets, idle rotation. | A rotatable full body, viewable from all directions. |
| **3. Layer breakdown** | All systems loaded lazily, layer cards wired up, dissolve transition, depth slider, realistic materials per system. | Clicking Skin → Muscle → Skeleton → Organs peels the body. |
| **4. Interaction + info** | Hover tooltip, click-select with outline/glow, camera fly-to, right panel and hero info driven by data, Isolate/Hide/X-ray. | Click the femur → its name and info appear. |
| **5. Exploded view + labels** | Line-up view like image 1, 3D leader-line labels. | Image 1 recreated in the app. |
| **6. Content** | Write and verify text for systems and roughly 60–100 key structures. | The info panels are fully populated. |
| **7. Polish + perf** | Post-FX tuning, quality toggle, mobile layout, loading screens, accessibility (keyboard navigation, contrast), attribution/credits page. | Smooth on desktop and phone. |
| **8. Deploy** *(optional)* | Static hosting on Vercel or Netlify. | A public URL. |

After each phase I'll stop briefly so you can check it before I continue.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Free models look "plastic" | Custom PBR materials, normal maps, SSAO and HDRI (Section 5). You can switch to a paid model later without code changes. |
| Huge model size → slow load | Per-system lazy load, decimation, Meshopt/KTX2, quality levels. |
| Skin shell (MakeHuman) doesn't line up with Z-Anatomy internals | Fit and align it in Blender during Phase 1. Fallback: use Z-Anatomy's own skin mesh. |
| Medical accuracy of text | Use reputable sources only. Mark the app as educational, not medical advice. |
| CC BY-SA licence obligations | Credits page + attribution in the footer. Modified models stay under CC BY-SA (fine for an educational project, but note this if you plan to sell it). |

---

## 12. Questions for You (please answer during review)

1. ~~**Model source**~~ → **Decided: free route (Z-Anatomy + MakeHuman).** No paid assets.
2. **Body:** male only, female only, or a toggle for both?
3. **Theme:** light like the Car Nexus reference, dark like image 1, or both with a toggle?
4. **Devices:** desktop-first with a working mobile view, or must mobile be a first-class experience?
5. **Detail depth for MVP:** stop at system level + about 60–100 key parts, or do you also want organ sub-parts (heart chambers, brain lobes) in the first version?
6. **Name/branding:** keep a working title like "Anatomy Nexus", or do you have a name?
7. **Hosting:** local only for now, or deploy to a public URL?
