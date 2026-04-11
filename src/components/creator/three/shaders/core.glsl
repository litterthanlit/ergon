// =============================================================================
// core.glsl — Shared GLSL utility library
// Prepended to every render-mode vertex/fragment shader at runtime.
//
// NOTE: Common uniforms are declared in each ShaderMaterial, NOT here:
//   uniform float uTime;
//   uniform float uBreathe;
//   uniform float uPulseSpeed;
//   uniform float uTempo;
//   uniform float uSeed;
//   uniform vec3  uPalette[5];
// =============================================================================

// -----------------------------------------------------------------------------
// Simplex Noise 3D
// Ashima Arts / Ian McEwan — MIT License
// https://github.com/ashima/webgl-noise
// -----------------------------------------------------------------------------

vec3 _mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 _mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 _permute(vec4 x) { return _mod289(((x * 34.0) + 1.0) * x); }
vec4 _taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = _mod289(i);
  vec4 p = _permute(
    _permute(
      _permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

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

  // Normalise gradients
  vec4 norm = _taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix contributions
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// -----------------------------------------------------------------------------
// Curl Noise — divergence-free vector field derived from simplex noise
// Returns a rotation-free flow field suitable for particle advection.
// -----------------------------------------------------------------------------

vec3 curlNoise(vec3 p) {
  const float e = 0.0001;

  vec3 dx = vec3(e,   0.0, 0.0);
  vec3 dy = vec3(0.0, e,   0.0);
  vec3 dz = vec3(0.0, 0.0, e  );

  // Partial derivatives via central differences
  float n_x = snoise(p + dy) - snoise(p - dy) -
              snoise(p + dz) + snoise(p - dz);
  float n_y = snoise(p + dz) - snoise(p - dz) -
              snoise(p + dx) + snoise(p - dx);
  float n_z = snoise(p + dx) - snoise(p - dx) -
              snoise(p + dy) + snoise(p - dy);

  return normalize(vec3(n_x, n_y, n_z) / (2.0 * e));
}

// -----------------------------------------------------------------------------
// Worley Noise (Cellular / Voronoi)
// Returns vec2(F1, F2) — distances to nearest and second-nearest feature points.
// Useful for cellular textures, vein patterns, and proximity effects.
// -----------------------------------------------------------------------------

vec2 worley(vec3 p) {
  vec3 Pi = floor(p);
  vec3 Pf = fract(p);

  float F1 = 1e10;
  float F2 = 1e10;

  for (int kz = -1; kz <= 1; kz++) {
    for (int ky = -1; ky <= 1; ky++) {
      for (int kx = -1; kx <= 1; kx++) {
        vec3 cell = Pi + vec3(float(kx), float(ky), float(kz));

        // Hash cell to get a pseudo-random point inside it
        vec3 h = fract(
          sin(vec3(
            dot(cell, vec3(127.1, 311.7,  74.7)),
            dot(cell, vec3(269.5, 183.3, 246.1)),
            dot(cell, vec3(113.5, 271.9, 124.6))
          )) * 43758.5453
        );

        vec3  r    = vec3(float(kx), float(ky), float(kz)) + h - Pf;
        float dist = dot(r, r); // squared distance

        if (dist < F1) { F2 = F1; F1 = dist; }
        else if (dist < F2) { F2 = dist; }
      }
    }
  }

  return sqrt(vec2(F1, F2));
}

// -----------------------------------------------------------------------------
// Fractional Brownian Motion
// Layered octaves of simplex noise for natural-looking turbulence.
// Amplitude halves and frequency doubles each octave (lacunarity=2, gain=0.5).
// -----------------------------------------------------------------------------

float fbm(vec3 p, int octaves) {
  float value     = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 8; i++) {   // unrolled up to 8; actual count gated below
    if (i >= octaves) break;
    value     += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

// -----------------------------------------------------------------------------
// Palette Lookup
// Smooth colour interpolation across an ordered 5-stop palette.
// t in [0, 1]. Returns an sRGB-space vec3.
// -----------------------------------------------------------------------------

vec3 paletteLookup(float t, vec3 palette[5]) {
  t = clamp(t, 0.0, 1.0);

  // Map t into one of the 4 segments between the 5 stops
  float scaled = t * 4.0;           // [0, 4]
  int   idx    = int(floor(scaled)); // 0..3
  float frac   = fract(scaled);

  // Clamp index so the last stop is reachable
  idx = clamp(idx, 0, 3);

  return mix(palette[idx], palette[idx + 1], smoothstep(0.0, 1.0, frac));
}

// -----------------------------------------------------------------------------
// SDF Primitives
// Signed-distance functions for metaball and soft-body blending.
// All sdX functions return the signed distance to the surface (negative = inside).
// -----------------------------------------------------------------------------

// Sphere centred at origin with radius r
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

// Capsule between points a and b with radius r
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Smooth minimum — blends two SDF values with softness k.
// k = 0 is a hard min; larger k produces a fatter blend region.
// Returns the blended distance (use for metaball union).
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0);
  return min(a, b) - h * h * 0.25 / k;
}

// -----------------------------------------------------------------------------
// Rotation Matrices
// Right-handed, column-major (matches GLSL / Three.js convention).
// -----------------------------------------------------------------------------

mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
     c,  0.0, s,
    0.0, 1.0, 0.0,
    -s,  0.0, c
  );
}

mat3 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0,  c,  -s,
    0.0,  s,   c
  );
}
