uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vNoise;

// Core noise functions are prepended at runtime via string concatenation

void main() {
  vPosition = position;
  vNormal = normal;

  float noiseVal = snoise(position * 0.01 + vec3(uTime * uPulseSpeed * 0.3, uSeed * 0.1, 0.0));
  vNoise = noiseVal;

  vec3 displaced = position + normal * noiseVal * uBreathe * 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
