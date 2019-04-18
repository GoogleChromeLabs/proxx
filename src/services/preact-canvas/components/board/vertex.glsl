#version 100
precision highp float;
attribute vec2 pos;
attribute vec2 tile_uv;
attribute vec3 static_tile_data;
attribute vec4 dynamic_tile_data;

varying vec2 uv;
varying vec2 coords;
varying vec2 iResolution2;
varying vec3 static_tile_data2;
varying vec4 dynamic_tile_data2;

uniform vec2 offset;
uniform vec2 iResolution;

void main() {
  // Remap to interval [0, 1] with
  // positive Y pointing up, positive X pointing right.
  vec2 screenPos = vec2(0., 1.) + vec2(1., -1.)*(pos+offset)/iResolution;
  // Clip space is 4d, intervals [-1, 1] with
  // positive Y pointing up, positive X pointing right.
  gl_Position = vec4(screenPos * 2. - vec2(1.), 0.0, 1.0);
  uv = tile_uv;
  iResolution2 = iResolution;
  static_tile_data2 = static_tile_data;
  dynamic_tile_data2 = dynamic_tile_data;
}