uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;

varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vNormal = normal;
  vec3 noisePos = position * 0.008 + vec3(uTime * uPulseSpeed * 0.15, uSeed * 0.05, 0.0);
  vec3 curl = curlNoise(noisePos);
  vec3 displaced = position + curl * uBreathe * 2.0;
  vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
