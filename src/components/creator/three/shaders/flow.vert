uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;

attribute float aProgress;
attribute vec3 aVelocity;

varying vec3 vWorldPos;
varying float vSpeed;
varying float vLife;

void main() {
  vec3 turbulence = curlNoise(position * 0.005 + vec3(uTime * uPulseSpeed * 0.1)) * uBreathe * 3.0;
  vec3 vel = aVelocity + turbulence;
  float t = fract(aProgress + uTime * uPulseSpeed * 0.2);
  vec3 displaced = position + vel * t * 50.0;
  vSpeed = length(vel);
  vLife = 1.0 - t;
  vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  gl_PointSize = max(1.0, 3.0 * vLife * (300.0 / length(modelViewMatrix * vec4(displaced, 1.0))));
}
