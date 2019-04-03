#version 100
precision mediump float;

varying vec2 uv;
uniform float iTime;
uniform vec2 iResolution;

#define remap(minIn, maxIn, minOut, maxOut, v) (((v) - (minIn)) / ((maxIn) - (minIn)) * ((maxOut) - (minOut)) + (minOut))

// sin(v) remapped to [0; 1]
float sin01(float v)
{
  v = sin(v);
  return remap(-1., 1., 0., 1., v);
}

// Random number between -1 and 1 exclusive
float random(vec2 st)
{
  // https://thebookofshaders.com/10/
  // Originally, the last number is 43757.233, but that seems
  // to be outside of the precision on some mobile devices, making
  // the PRNG useless.
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 3.233);
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

#define NUM_OCTAVES 2
float fbm(vec2 st)
{
  float value = 0.0;
  float amplitude = .5;
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
  // Config vars
  vec4 darkblue = (vec4(8.0 / 255.0, 11.0 / 255.0, 100.0 / 255.0, 1.0));
  vec4 blue = (vec4(28.0 / 255.0, 150.0 / 255.0, 210.0 / 255.0, 1.0));
  float fbmScrollFactor = -40.;
  float nebulaScale = 10.;
  float contrast = 5.;

  vec2 p = uv;
  // Maintain aspect ratio
  p.x *= iResolution.x / iResolution.y;

  float time = iTime;
  p += vec2(-0.5);

  // Displace the point
  for(int i = 0; i < 10; i++) {
	  p += vortexDisplacement(p, vec2(0.0)) * .03;
  }
  // Get intensity of noise at distorted point coordinates
  float f = fbm(p * nebulaScale + vec2(time * fbmScrollFactor, 0.0));
  // Set color acccording to insensity
  gl_FragColor = mix(darkblue, blue, smoothstep(.1, .7, f) / contrast);
}
