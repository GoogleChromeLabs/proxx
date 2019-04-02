#version 100
precision mediump float;

varying vec2 uv;
uniform float iTime;

// All possible tuples of -1, 0 and 1 except (0; 0)
// vec2 perlinGradients[8];

// Pseudo RNG
float hash(vec2 v) {
    return fract(sin(dot(v.xy,vec2(12.9898,78.233))) * 43758.5453);
}

// Picks a random (but deterministic) gradient vector for the last grid corner
// [0] = vec2(1.0, 0.0);
// [1] = vec2(-1.0, 0.0);
// [2] = vec2(1.0, 1.0);
// [3] = vec2(-1.0, 1.0);
// [4] = vec2(0.0, 1.0);
// [5] = vec2(0.0, -1.0);
// [6] = vec2(1.0, -1.0);
// [7] = vec2(-1.0, -1.0);
vec2 gradient(vec2 v) {
    // Random number between 0 and 7 inclusive
    int idx = int(floor(hash(v) * 8.0));
    vec2 r = vec2(int(mod(float(idx), 2.0)) == 0 ? 1 : -1, 0.0);
    if(idx == 4 || idx == 5) {
        r.x = 0.0;
    }
    if(idx >= 2) {
        r.y = 1.0;
    }
    if(idx >= 5) {
        r.y = -1.0;
    }
    return r;
}

// Custom smoothing function
float fade(float t) {
    return t*t*t*(t*(t*6.0 - 15.0) + 10.0);
}

// Perlin noise, range [-1.0; 1.0]
float perlin(vec2 p) {
    vec2 p00 = floor(p);
    vec2 g00 = gradient(p00);

    vec2 p10 = p00 + vec2(1.0, 0.0);
    vec2 g10 = gradient(p10);

    vec2 p01 = p00 + vec2(0.0, 1.0);
    vec2 g01 = gradient(p01);

    vec2 p11 = p00 + vec2(1.0, 1.0);
    vec2 g11 = gradient(p11);

    vec2 t = vec2(fade(p.x - p00.x), fade(p.y - p00.y));

    float ix0 = (1.0 - t.x)*dot(g00, (p - p00)) + t.x*dot(g10, (p - p10));
  	float ix1 = (1.0 - t.x)*dot(g01, (p - p01)) + t.x*dot(g11, (p - p11));
    return (1.0 - t.y)*ix0 + t.y*ix1;
}

// Addition of multiple octaves of perlin noise with
// increasing frequency and decreasing amplitude.
float perlinOctaves(int maxOct, int minOct, vec2 p) {
    float h = 0.0;
    // GLSL ES 1.0 can only do constants in loop expressions.
    // So I am moving everything to variables outside and use
    // a if-break :-/
    int numOcts = maxOct - minOct;

    for(int i = 0; i < 16; i++) {
        if(i >= numOcts) {
            break;
        }
        int oct = minOct + i;
        h += perlin(p * pow(2.0, float(oct))) * 1.0/pow(2.0, float(oct));
    }
    return h;
}

// Colorized perlin noise that goes from color to black with the given steepness.
vec4 colorPerlin(int maxOct, int minOct, float peak, float steepness, vec4 color, vec2 uv) {
    // Generate perlin noise
    float h = perlinOctaves(maxOct, minOct, uv);
    // Normalize to range [0.0; 1.0]
    h = h/2.0 + 0.5;
    // Limit function
    h = smoothstep(peak-steepness, peak, h) * (1.0 - smoothstep(peak, peak+steepness, h));
    //h = pow(h, gamma);
    // Colorize
    return mix(vec4(0.0), color, h);
}

// Remaps [minIn; maxIn] to [minOut; maxOut]
float remap(float minIn, float maxIn, float minOut, float maxOut, float v) {
    return (v - minIn)/(maxIn - minIn) * (maxOut - minOut) + minOut;
}

vec4 premultiplyAlpha(vec4 c) {
    vec4 r = c * vec4(c.a);
    r.a = c.a;
    return r;
}

vec4 demultiplyAlpha(vec4 c) {
    vec4 r = c / vec4(c.a);
    r.a = c.a;
    return r;
}
void main() {
    float speed = 5.0;
    vec4 pink = premultiplyAlpha(vec4(180.0/255.0, 50.0/255.0, 128.0/255.0, 1.0));
    vec4 turquoise = premultiplyAlpha(vec4(80.0/255.0, 200.0/255.0, 200.0/255.0, 1.0));
    vec4 blue = premultiplyAlpha(vec4(28.0/255.0, 150.0/255.0, 210.0/255.0, 1.0));
    vec4 white = premultiplyAlpha(vec4(vec3(1.0), 1.0));
    vec4 darkblue = premultiplyAlpha(vec4(8.0/255.0, 11.0/255.0, 100.0/255.0, 1.0));

    // Change number to select a different random cloud
    int seed = 3;

    vec2 pinkOffset = vec2(1.0, 0.0);
    vec2 turquoiseOffset = vec2(0.0, 0.3);
    vec2 blueOffset = vec2(0.0, 0.5);
    vec2 whiteOffset = vec2(0.0, 2.6);

 	// For squishing
    vec2 squish = vec2(0.6, 1.4);
    // Time-based distortion
    vec2 animate = vec2(
        remap(-1.0, 1.0, 0.8, 1.6, sin(iTime/speed)),
        remap(-1.0, 1.0, 0.3, 1.5, cos(iTime/speed))
    );
    vec2 animateLess = vec2(
        remap(-1.0, 1.0, 1.05, 0.9, sin(iTime/speed)),
        remap(-1.0, 1.0, 1.2, 0.95, cos(iTime/speed))
    );

    vec2 uvAnimated = uv * squish * animate;
    vec2 uvAnimatedLess = uv * squish * animateLess;

    // Layer 1
    vec4 color = darkblue;
    // Layer 2
    vec4 bluePerlin = colorPerlin(1, 0, 0.5, 0.5, blue, uvAnimated + vec2(seed) + blueOffset);
    color = mix(
        color,
        bluePerlin,
        bluePerlin.a
    );
    // Layer 3
    vec4 turquoisePerlin = colorPerlin(1, 0, 0.5, 0.5, turquoise, uvAnimated + vec2(seed) + turquoiseOffset);
    color = mix(
        color,
        turquoisePerlin,
        turquoisePerlin.a
    );

    // Layer 4
    vec4 whitePerlin = colorPerlin(2, 0, 0.2, 0.5, white, uvAnimated + vec2(seed) + whiteOffset);
    color = mix(
        color,
        whitePerlin,
        whitePerlin.a
    );
    // Layer 5
    vec4 pinkPerlin = colorPerlin(2, 0, 0.7, 0.4, pink, uvAnimatedLess + vec2(seed) + pinkOffset);
    color = mix(
        color,
        pinkPerlin,
        pinkPerlin.a
    );

    gl_FragColor = demultiplyAlpha(color);
}