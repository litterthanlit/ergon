uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;
uniform vec3 uPalette[5];

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFlicker;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float shift = snoise(vWorldPos * 0.02 + vec3(uTime * uPulseSpeed * 0.8));
  vec3 color = paletteLookup(shift * 0.5 + 0.5, uPalette);
  float arc = abs(snoise(vWorldPos * 0.05 + vec3(uTime * uPulseSpeed * 2.0, uSeed * 0.3, 0.0)));
  arc = pow(arc, 3.0) * 4.0;
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 4.0);
  float corona = fresnel * 2.0;
  float emission = (arc + corona) * (0.5 + vFlicker * 1.5);
  float randomFlicker = snoise(vec3(uTime * 10.0 + uSeed, 0.0, 0.0)) * 0.3 + 0.7;
  emission *= randomFlicker;
  color *= emission;
  color += vec3(0.3, 0.5, 1.0) * corona * 0.5;
  gl_FragColor = vec4(color, min(emission * 0.5, 0.95));
}
