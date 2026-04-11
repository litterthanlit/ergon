uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vGrowth;

void main() {
  vNormal = normalMatrix * normal;
  float sway = snoise(position * 0.02 + vec3(uTime * uPulseSpeed * 0.2, uSeed * 0.1, 0.0));
  vec3 displaced = position + normal * sway * uBreathe * 0.4;
  float growth = sin(uTime * uPulseSpeed * 0.5 + length(position) * 0.01) * 0.5 + 0.5;
  vGrowth = growth;
  displaced *= 1.0 + growth * 0.1;
  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
