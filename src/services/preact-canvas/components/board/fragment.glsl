#version 100
precision mediump float;

varying vec2 uv;
varying vec2 coords;
varying vec2 iResolution2;

uniform vec4 frame;
uniform float sprite_size;
uniform float tile_size;
// uniform vec2 gridSize;
uniform sampler2D idle_sprites[4];
uniform sampler2D static_sprite;

// uniform int frame;

void main() {
  vec4 white = vec4(1.);
  vec4 black = vec4(vec3(0.), 1.);
  vec4 transparent = vec4(0.);

  vec2 normalized_uv = vec2(0., 1.) + vec2(1., -1.)*uv;

  float f;
  vec2 idle_tex_uv = (frame.xy + normalized_uv) * tile_size / sprite_size;
  int sprite_idx = int(frame.w);
  // WebGL 1 can only access arrays with compile-time constant indices.
  // So be it.
  if(sprite_idx == 0) {
    f = texture2D(idle_sprites[0], idle_tex_uv).r;
  } else if (sprite_idx == 1) {
    f = texture2D(idle_sprites[1], idle_tex_uv).r;
  } else if (sprite_idx == 2) {
    f = texture2D(idle_sprites[2], idle_tex_uv).r;
  } else if (sprite_idx == 3) {
    f = texture2D(idle_sprites[3], idle_tex_uv).r;
  }

  // Blend static outline in top
  vec2 static_tex_uv = (vec2(0.) + normalized_uv) * tile_size / sprite_size;
  f = mix(f, 1., texture2D(static_sprite, static_tex_uv).r);
  gl_FragColor = mix(transparent, white, f);

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
