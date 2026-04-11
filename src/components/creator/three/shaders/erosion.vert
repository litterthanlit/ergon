uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
varying float vSlope;

void main() {
  float height = fbm(position * 0.015 + vec3(uSeed * 0.1, uTime * uPulseSpeed * 0.05, 0.0), 6);
  height *= uBreathe * 1.5;
  vHeight = height;
  vec3 displaced = position + normal * height;
  float hx = fbm((position + vec3(0.5, 0.0, 0.0)) * 0.015 + vec3(uSeed * 0.1, uTime * uPulseSpeed * 0.05, 0.0), 6);
  float hz = fbm((position + vec3(0.0, 0.0, 0.5)) * 0.015 + vec3(uSeed * 0.1, uTime * uPulseSpeed * 0.05, 0.0), 6);
  vSlope = abs(hx - height) + abs(hz - height);
  vNormal = normalMatrix * normal;
  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
