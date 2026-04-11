uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;
uniform vec3 uPalette[5];

varying vec3 vPosition;
varying vec3 vNormal;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

  vec2 w = worley(vPosition * 0.02 + vec3(uTime * uPulseSpeed * 0.1));
  float caustic = smoothstep(0.0, 0.3, w.y - w.x);

  float colorIdx = vNoise * 0.5 + 0.5;
  vec3 baseColor = paletteLookup(colorIdx, uPalette);

  float sss = pow(max(0.0, dot(viewDir, -vNormal)), 2.0) * 0.3;

  vec3 color = baseColor * (0.5 + caustic * 0.5);
  color += fresnel * baseColor * 1.5;
  color += sss * baseColor;

  float emissive = fresnel * 0.8 + caustic * 0.3;

  gl_FragColor = vec4(color, 0.9);
}
