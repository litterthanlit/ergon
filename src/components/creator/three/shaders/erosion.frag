uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;
uniform vec3 uPalette[5];

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
varying float vSlope;

void main() {
  float normalizedHeight = vHeight / (uBreathe * 1.5 + 0.001);
  vec3 color = paletteLookup(normalizedHeight * 0.5 + 0.25, uPalette);
  color *= 0.5 + normalizedHeight * 0.5;
  float crack = smoothstep(0.02, 0.08, vSlope);
  color = mix(color, color * 0.2, crack * 0.7);
  float ao = smoothstep(-0.5, 0.5, normalizedHeight);
  color *= 0.6 + ao * 0.4;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
  color += color * fresnel * 0.3;
  float shedSparkle = step(0.06, vSlope) * step(0.95, snoise(vWorldPos * 0.3 + vec3(uTime * uPulseSpeed * 1.0))) * 2.0;
  color += vec3(1.0) * shedSparkle;
  gl_FragColor = vec4(color, 0.95);
}
