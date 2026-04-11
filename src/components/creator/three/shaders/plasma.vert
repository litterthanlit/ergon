uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFlicker;

void main() {
  vNormal = normalMatrix * normal;
  float jitter = snoise(position * 0.1 + vec3(uTime * uPulseSpeed * 3.0, uSeed, 0.0));
  float flickerIntensity = step(0.7, abs(jitter));
  vFlicker = flickerIntensity;
  vec3 displaced = position + normal * jitter * uBreathe * 0.2 * flickerIntensity;
  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
