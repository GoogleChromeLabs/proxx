#version 100
precision mediump float;

varying vec2 uv;
varying vec2 coords;
varying vec2 iResolution2;

// uniform float iTime;
// uniform vec2 gridSize;
// uniform sampler2D sprite;
// uniform sampler2D state;

// uniform int frame;

void main() {
  vec4 white = vec4(1.);
  vec4 black = vec4(vec3(0.), 1.);
  gl_FragColor = mix(black, white, step(.5, mod(coords.x + coords.y , 2.)/2.));
  // vec4 black = vec4(vec3(.0), 1.);
  // vec4 white = vec4(1.);
  // vec4 transparent = vec4(0.);

  // vec4 blue = vec4(50., 2., 224., 255.)/vec4(255.);
  // vec4 lightblue = vec4(86., 131., 240., 255.)/vec4(255.);
  // vec4 purple = vec4(132., 46., 247., 255.)/vec4(255.);

  // float tileSize = 64.;
  // float gap = 10.;
  // float tileTimeOffset = length(coords) * 12.;

  // int offsetFrame = int(mod(float(frame) + 600. - tileTimeOffset, 600.));
  // int y = offsetFrame / 16;
  // int x = offsetFrame - y * 16; // = frame % 32


  // vec2 unit = 1./vec2(16., 64.);
  // vec4 color = mix(
  //   transparent,
  //   vec4(texture2D(state, coords/gridSize).rgb, 1.),
  //   texture2D(sprite, (uv + vec2(x, y))*unit).r
  // );
  // gl_FragColor = color;
  // gl_FragColor = mix(
  //   texture2D(sprite, gl_FragCoord.xy / iResolution2),
  //   texture2D(state, gl_FragCoord.xy / iResolution2),
  //   step(.5, gl_FragCoord.x / iResolution2.x)
  // );
}
