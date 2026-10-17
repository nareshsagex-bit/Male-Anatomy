// Shader additions injected into MeshPhysicalMaterial for every tissue:
//  - procedural micro-detail (bump + tone variation) per tissue kind, faded out when too small to resolve
//  - a noise-based dissolve with a glowing edge, used to peel layers away
//  - an emissive highlight for hover/selection

export const TISSUE_KINDS = {
  skin: 0,
  muscle: 1,
  tendon: 2,
  bone: 3,
  cartilage: 4,
  organ: 5,
  vessel: 6,
  nerve: 7,
  brain: 8,
  node: 9,
} as const
export type TissueKind = keyof typeof TISSUE_KINDS

const NOISE = /* glsl */ `
vec4 tPermute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 tTaylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float tNoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = tPermute(tPermute(tPermute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = tTaylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fades detail out once a noise cell is smaller than a pixel (prevents shimmering).
float tDetailFade(vec3 p){ return 1.0 - smoothstep(0.35, 1.2, length(fwidth(p))); }

// Height field for bump mapping, in roughly 0..1.
float tHeight(vec3 w){
  #if TISSUE_KIND == 0
    vec3 p = w * 650.0; vec3 q = w * 90.0;
    return (tNoise(p) * 0.35 * tDetailFade(p) + tNoise(q) * 0.65 * tDetailFade(q)) * 0.5;
  #elif TISSUE_KIND == 1
    vec3 p = w * vec3(520.0, 26.0, 520.0); vec3 q = w * 140.0;
    return tNoise(p) * tDetailFade(p) * 0.8 + tNoise(q) * tDetailFade(q) * 0.2;
  #elif TISSUE_KIND == 2
    vec3 p = w * vec3(380.0, 30.0, 380.0);
    return tNoise(p) * tDetailFade(p) * 0.5;
  #elif TISSUE_KIND == 3
    vec3 p = w * 420.0; vec3 q = w * 55.0;
    return tNoise(p) * 0.45 * tDetailFade(p) + tNoise(q) * 0.55 * tDetailFade(q);
  #elif TISSUE_KIND == 8
    vec3 p = w * 70.0;
    return tNoise(p) * tDetailFade(p);
  #else
    vec3 p = w * 160.0;
    return tNoise(p) * tDetailFade(p) * 0.6;
  #endif
}

// Low-frequency tone variation so large surfaces don't look flat/plastic.
float tTone(vec3 w){
  #if TISSUE_KIND == 1
    vec3 p = w * vec3(260.0, 14.0, 260.0);
    return tNoise(p) * tDetailFade(p) * 0.6 + tNoise(w * 9.0) * 0.4;
  #else
    return tNoise(w * 7.0) * 0.6 + tNoise(w * 31.0) * 0.4;
  #endif
}

vec3 tPerturbNormal(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir){
  vec3 sx = normalize(dFdx(surfPos));
  vec3 sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, surfNorm);
  vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`

export interface TissueUniforms {
  uDissolve: { value: number }
  uEdgeColor: { value: import('three').Color }
  uHighlight: { value: number }
  uHighlightColor: { value: import('three').Color }
  uBump: { value: number }
  uToneVar: { value: number }
}

export function injectTissueShader(
  shader: { vertexShader: string; fragmentShader: string; uniforms: Record<string, unknown> },
  uniforms: TissueUniforms,
) {
  Object.assign(shader.uniforms, uniforms)

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vTissueWorld;')
    .replace(
      '#include <project_vertex>',
      '#include <project_vertex>\nvTissueWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
    )

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
varying vec3 vTissueWorld;
uniform float uDissolve;
uniform vec3 uEdgeColor;
uniform float uHighlight;
uniform vec3 uHighlightColor;
uniform float uBump;
uniform float uToneVar;
${NOISE}`,
    )
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
float tDissolveV = 0.0;
float tThreshold = -1.0;
if (uDissolve > 0.001) {
  float dn = tNoise(vTissueWorld * 11.0) * 0.5 + 0.5;
  float sweep = 1.0 - clamp((vTissueWorld.y + 0.1) / 1.9, 0.0, 1.0);
  tDissolveV = dn * 0.6 + sweep * 0.4;
  tThreshold = uDissolve * 1.12 - 0.06;
  if (tDissolveV < tThreshold) discard;
}`,
    )
    .replace(
      '#include <color_fragment>',
      `#include <color_fragment>
diffuseColor.rgb *= 1.0 + uToneVar * tTone(vTissueWorld);`,
    )
    .replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
if (uBump > 0.0) {
  float th = tHeight(vTissueWorld);
  normal = tPerturbNormal(-vViewPosition, normal, vec2(dFdx(th), dFdy(th)) * uBump, faceDirection);
}`,
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
totalEmissiveRadiance += uHighlightColor * uHighlight;
if (uDissolve > 0.001) {
  float edge = 1.0 - smoothstep(tThreshold, tThreshold + 0.035, tDissolveV);
  totalEmissiveRadiance += uEdgeColor * edge * 3.0;
}`,
    )
}
