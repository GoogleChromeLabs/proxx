#version 100
precision mediump float;

varying vec2 uv;
uniform float iTime;
uniform vec2 iResolution;

#define remap(minIn, maxIn, minOut, maxOut, v) (((v) - (minIn))/((maxIn) - (minIn)) * ((maxOut) - (minOut)) + (minOut))

// sin(v) remapped to [0; 1]
float sin01(float v) {
  v = sin(v);
  return remap(-1., 1., 0., 1., v);
}


// Random number between -1 and 1 exclusive
float random (in vec2 st) {
    // https://thebookofshaders.com/10/
    // Originally, the last number is 43757.233, but that seems
    // to be outside of the precision on some mobile devices, making
    // the PRNG useless.
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 3.233);
}

// Noise field between -1 and 1
float noise (vec2 st) {
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
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}


float fbm (vec2 st) {
    float value = 0.0;
    float amplitude = .5;
	float lacunarity = 2.0;
	float gain = 0.5;

        value += amplitude * noise(st);
        st *= lacunarity;
        amplitude *= gain;

  return value;
}


vec2 vortex(vec2 center, float strength, vec2 p) {
  float d = abs(distance(p, center));
  float v = cos(d*3.);
  float theta = remap(-1., 1., 0., 2., v) / (1. + length(p)) * strength ;
  mat2 rot = mat2(cos(theta), -sin(theta), sin(theta), cos(theta));
  return rot * (p-center) + center;
}


void main() {
  vec4 darkblue = (vec4(8.0/255.0, 11.0/255.0, 100.0/255.0, 1.0));
  vec4 blue = (vec4(28.0/255.0, 150.0/255.0, 210.0/255.0, 1.0));

  vec2 p = uv * 4.;
  p.x *= iResolution.x/iResolution.y;


  float time = sin01(iTime/10.0);
  float fbmScrollFactor = 40.4;


  vec2 vortexUV = vortex(vec2(0.5), 4., p);
  float f = fbm(vortexUV*10. + vec2(time * fbmScrollFactor, 0.0));
  gl_FragColor = mix(darkblue, vec4(1.0), smoothstep(0., 1., f));
}
