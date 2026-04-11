uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;
uniform vec3 uPalette[5];

varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  float density = fbm(vWorldPos * 0.005 + vec3(uTime * uPulseSpeed * 0.05), 5);
  density = smoothstep(-0.2, 0.8, density);
  float depth = length(vWorldPos - cameraPosition);
  float fog = exp(-depth * 0.002);
  vec3 color = paletteLookup(density, uPalette);
  float emission = density * 1.5;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
  color += fresnel * color * 0.8;
  color *= fog;
  gl_FragColor = vec4(color * emission, density * 0.85);
}
