uniform float uTime;
uniform float uBreathe;
uniform float uPulseSpeed;
uniform float uSeed;
uniform vec3 uPalette[5];

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float angle = dot(vViewDir, vNormal);
  float prism = sin(angle * 12.0 + uTime * uPulseSpeed * 0.5) * 0.5 + 0.5;
  vec3 baseColor = paletteLookup(prism, uPalette);
  vec3 caustic = vec3(
    sin(angle * 20.0 + uTime * 0.3) * 0.5 + 0.5,
    sin(angle * 20.0 + uTime * 0.3 + 2.094) * 0.5 + 0.5,
    sin(angle * 20.0 + uTime * 0.3 + 4.189) * 0.5 + 0.5
  );
  float refractStrength = pow(1.0 - abs(angle), 4.0);
  vec3 color = mix(baseColor, caustic, refractStrength * 0.6);
  vec3 halfDir = normalize(vViewDir + normalize(vec3(0.0, 1.0, 0.5)));
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
  color += vec3(1.0) * spec * 0.8;
  float fresnel = pow(1.0 - abs(dot(vViewDir, vNormal)), 3.0);
  color += baseColor * fresnel * 1.2;
  gl_FragColor = vec4(color, 0.92);
}
