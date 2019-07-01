#version 100
precision highp float;
attribute vec2 pos;
varying vec2 uv;

void main() {
  gl_Position = vec4(pos, 0.0, 1.0);
  uv = pos / 2.0 + 0.5;
}