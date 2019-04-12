#version 100
precision mediump float;

varying vec2 uv;
uniform vec2 iResolution;

uniform float nebula_time;
uniform float circle_time;
uniform float danger_mode;

#define remap(minIn, maxIn, minOut, maxOut, v) (((v) - (minIn)) / ((maxIn) - (minIn)) * ((maxOut) - (minOut)) + (minOut))

// Random number between -1 and 1 exclusive
float random(vec2 st)
{
  // https://thebookofshaders.com/10/
  // Originally, the last number is 43757.233, but that seems
  // to be outside of the mediump precision on some mobile devices, making
  // the PRNG useless.
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 3.233);
}

float easeInOutExpo(float t) {
  if (t == 0.0 || t == 1.0) {
    return t;
  }
  if ((t *= 2.0) < 1.0) {
    return 0.5 * pow(2.0, 10.0 * (t - 1.0));
  } else {
    return 0.5 * (-pow(2.0, -10.0 * (t - 1.0)) + 2.0);
  }
}

// Noise field between -1 and 1
float noise(vec2 st)
{
  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f;
  // These two are equivalent
  u = smoothstep(0., 1., f);
  //u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 1
float fbm(vec2 st)
{
  float value = 0.0;
  float amplitude = 1.;
  float lacunarity = 2.0;
  float gain = 0.5;

  for(int i = 0; i < NUM_OCTAVES; i++) {
    value += amplitude * noise(st);
    st *= lacunarity;
    amplitude *= gain;
  }

  return value;
}

vec2 vortexDisplacement (vec2 q, vec2 c) {
  vec2 d = q - c;
  return vec2(d.y, -d.x) / (length(d) + 0.05);
}


void main() {
  // Colors
  vec4 darkviolet = vec4(58., 10., 78., 255.) / 255.;
  vec4 blue = vec4(43., 41., 111., 255.) / 255.;

  vec4 darkred = vec4(53., 0., 0., 255.) / 255.;
  vec4 red = vec4(117., 32., 61., 255.) / 255.;

  vec4 black = vec4(vec3(0.), 1.);
  vec4 white = vec4(1.);

  // Move origin to center and normalize
  vec2 normalized_uv = (uv - vec2(.5))/.5;
  // Keep aspect ratio
  normalized_uv = normalized_uv * iResolution / min(iResolution.x, iResolution.y);

  // Nebula
  vec4 nebula_color;
  {
    float speed = 0.1;
    float nebulaScale = 1.1;
    float vortexInfluence = .05;

    vec2 p = normalized_uv;
    // Displace the point with vortex
    for(int i = 0; i < 5; i++) {
        p += vortexDisplacement(p, vec2(0.)) * vortexInfluence;
    }
    // Get intensity of noise at distorted point coordinates
    float f = fbm(p * nebulaScale + vec2(nebula_time * speed, 0.0));
    // Set color acccording to insensity
    nebula_color = mix(
      mix(darkviolet, darkred, danger_mode),
      mix(blue, red, danger_mode),
      easeInOutExpo(f)
    );
  }

  // Circle 1
  vec4 circle_color = vec4(.0);
  {
    float radius = .2;
    vec2 rotation_center = vec2(1, -1.);
    vec2 offset = vec2(.2, -.4);
    float alpha = circle_time*0.901;
    mat2 rotation = mat2(cos(alpha), sin(alpha), -sin(alpha), cos(alpha));
    vec2 p = normalized_uv - offset;
    p = rotation *(p - rotation_center) + rotation_center;

    float d = length(p) - radius;
    float circle_mask = (1. - smoothstep(0., 0.01, d));

    circle_color = clamp(vec4(0.), vec4(1.), circle_color + mix(black, red*.1, circle_mask));
  }

  // Circle 2
  {
    float radius = .3;
    vec2 rotation_center = vec2(0., -3.);
    vec2 offset = vec2(-.2, .3);
    float alpha = circle_time*.601 ;
    mat2 rotation = mat2(cos(alpha), sin(alpha), -sin(alpha), cos(alpha));
    vec2 p = normalized_uv - offset;
    p = rotation *(p - rotation_center) + rotation_center;

    float d = length(p) - radius;
    float circle_mask = (1. - smoothstep(0., 0.01, d));

    circle_color = clamp(vec4(0.), vec4(1.), circle_color + mix(black, red*.1, circle_mask));
  }

  // Circle 3
  {
    float radius = .1;
    vec2 rotation_center = vec2(-1., -8.);
    vec2 offset = vec2(0., .6);
    float alpha = circle_time*.201;
    mat2 rotation = mat2(cos(alpha), sin(alpha), -sin(alpha), cos(alpha));
    vec2 p = normalized_uv - offset;
    p = rotation *(p - rotation_center) + rotation_center;

    float d = length(p) - radius;
    float circle_mask = (1. - smoothstep(0., 0.01, d));

    circle_color = clamp(vec4(0.), vec4(1.), circle_color + mix(black, red*.1, circle_mask));
  }

  // Soft light blending
  gl_FragColor = vec4(vec3(1.) - (vec3(1.) - nebula_color.rgb)*(vec3(1.) - circle_color.rgb), 1.);
}
