#version 100
precision mediump float;

varying vec2 uv;
uniform float iTime;
uniform vec2 iResolution;

/**
 * Perlin noise
 */

const vec4 hashf4 = vec4 (0., 1., 57., 58.);
const vec3 hashf3 = vec3 (1., 57., 113.);
const float hashC = 43758.54;

vec4 hash(float p) {
  return fract(sin(p + hashf4) * hashC);
}

vec2 smoothing(vec2 f) {
  return f * f * (3. - 2. * f);
}

float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = smoothing(fract(p));
  vec4 t = hash(dot(i, hashf3.xy));

  // Bilinear interpolation
  return mix (
      mix (t.x, t.y, f.x),
      mix (t.z, t.w, f.x),
      f.y
  );
}

#define NUM_OCTAVES 4
float perlinOctaves(vec2 p)
{
  float s = 0.0;
  float a = 1.0;
  for (int i = 0; i <= NUM_OCTAVES; i++) {
    s += a * perlin (p);
    a *= 0.5;
    p *= 2.;
  }
  return s;
}


/**
 * Vortex flow field
 */

vec2 vortex (vec2 q, vec2 c) {
  vec2 d = q - c;
  return 0.25 * vec2 (d.y, - d.x) / (dot (d, d) + 0.05);
}

vec2 vortexflowfield (vec2 q, float iTime) {
  float dir = 1.;
  vec2 vr = vec2(0.0);
  vec2 c = vec2(mod(iTime, 10.0) - 20.0, 0.6 * dir);
  for (int k = 0; k < 30; k ++) {
    vr += dir * vortex(4. * q, c);
    c = vec2 (c.x + 1., - c.y);
    dir = - dir;
  }
  return vr;
}

void main() {
    vec4 darkblue = (vec4(8.0/255.0, 11.0/255.0, 100.0/255.0, 1.0));
    vec4 blue = (vec4(28.0/255.0, 150.0/255.0, 210.0/255.0, 1.0));
    vec2 p = uv;
    p.x *= iResolution.x / iResolution.y;
    p = (p - vec2(0.5))*0.6;
    for (int i = 0; i < 10; i++) {
      p -= vortexflowfield(p, iTime/10.0) * 0.03;
    }
    float v = perlinOctaves(p + vec2(iTime/30.0, 0.0));
    gl_FragColor = mix(darkblue, blue, v/1.0);
}