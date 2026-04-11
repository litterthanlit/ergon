uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vNormal = normalMatrix * normal;
  float facetNoise = snoise(position * 0.05 + vec3(uSeed * 0.1));
  float facetScale = step(0.3, abs(facetNoise)) * uBreathe * 0.3;
  vec3 displaced = position + normal * facetScale;
  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
