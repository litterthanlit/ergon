uniform float uTime;
uniform vec3 uPalette[5];

varying vec3 vWorldPos;
varying float vSpeed;
varying float vLife;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.2, dist) * vLife;
  float speedNorm = clamp(vSpeed * 0.5, 0.0, 1.0);
  vec3 color = paletteLookup(speedNorm, uPalette);
  color += vec3(1.0) * smoothstep(0.3, 0.0, dist) * 0.5;
  gl_FragColor = vec4(color, alpha * 0.8);
}
