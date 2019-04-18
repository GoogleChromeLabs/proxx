#version 100
precision mediump float;

varying vec2 uv;
varying vec3 static_tile_data2;
varying vec4 dynamic_tile_data2;
varying vec2 iResolution2;

uniform vec4 frame;
uniform float sprite_size;
uniform float tile_size;
uniform sampler2D idle_sprites[4];
uniform sampler2D static_sprite;


void main() {
  vec4 white = vec4(1.);
  vec4 black = vec4(vec3(0.), 1.);
  vec4 transparent = vec4(0.);
  vec4 turquoise = vec4(vec3(109., 205., 218.)/255., 1.);

  vec2 normalized_uv = vec2(0., 1.) + vec2(1., -1.)*uv;

  float highlight_opacity = dynamic_tile_data2.x;
  float flash_opacity = dynamic_tile_data2.y;
  float border_opacity = dynamic_tile_data2.z;
  float boxes_opacity = dynamic_tile_data2.w;

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
  f *= boxes_opacity;

  // Blend static outline in top
  vec2 outline_tex_uv = (vec2(0.) + normalized_uv) * tile_size / sprite_size;
  f = mix(f, border_opacity, texture2D(static_sprite, outline_tex_uv).r);

  // Blend flash on top
  vec2 flash_tex_uv = (vec2(9., 0.) + normalized_uv) * tile_size / sprite_size;
  f = mix(f, 1., texture2D(static_sprite, flash_tex_uv).r);

  // Change color according to highlight setting
  vec4 target_color = mix(white, turquoise, highlight_opacity);

  gl_FragColor = mix(transparent, target_color, f);
}
