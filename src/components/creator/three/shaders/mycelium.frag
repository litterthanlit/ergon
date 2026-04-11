uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;
uniform vec3 uPalette[5];

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vGrowth;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);
  vec2 veins = worley(vWorldPos * 0.03 + vec3(uSeed * 0.1));
  float veinPattern = smoothstep(0.0, 0.15, veins.x);
  vec3 bioColor = paletteLookup(vGrowth, uPalette);
  vec3 glowColor = mix(bioColor, vec3(0.2, 1.0, 0.6), 0.3);
  float emission = (1.0 - veinPattern) * 1.5 + fresnel * 1.2;
  float sparkle = step(0.97, snoise(vWorldPos * 0.5 + vec3(uTime * 2.0))) * 3.0;
  vec3 color = glowColor * emission + vec3(1.0) * sparkle;
  gl_FragColor = vec4(color, 0.85 + fresnel * 0.15);
}
