/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-ignore
import vertexShader from "./vertex.glsl";

function setShader(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  type: number,
  src: string
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw Error("Could not create shader");
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(
      `Error compiling ${
        type === gl.VERTEX_SHADER ? "vertex" : "fragment"
      } shader: ${gl.getShaderInfoLog(shader)}`
    );
  }
  gl.attachShader(program, shader);
  return shader;
}

export interface ShaderBoxOpts {
  canvas?: HTMLCanvasElement;
}
export default class ShaderBox {
  readonly canvas: HTMLCanvasElement;
  private _gl: WebGLRenderingContext;
  private _iGlobalTimeUniform: WebGLUniformLocation;
  private _running = false;

  constructor(
    private _fragmentShader: string,
    opts: Partial<ShaderBoxOpts> = {}
  ) {
    opts = {
      canvas: opts.canvas || document.createElement("canvas")
    };
    this.canvas = opts.canvas!;
    this._gl = this.canvas.getContext("webgl", { antialias: false })!;
    if (!this._gl) {
      throw Error("No support for WebGL");
    }
    const program = this._gl!.createProgram();
    if (!program) {
      throw Error("Could not create program");
    }
    setShader(this._gl, program, this._gl.VERTEX_SHADER, vertexShader);
    setShader(
      this._gl,
      program,
      this._gl.FRAGMENT_SHADER,
      this._fragmentShader
    );
    this._gl.linkProgram(program);
    if (!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
      throw Error(
        `Couldn’t link program: ${this._gl.getProgramInfoLog(program)}`
      );
    }
    this._gl.validateProgram(program);
    if (!this._gl.getProgramParameter(program, this._gl.VALIDATE_STATUS)) {
      throw Error(
        `Couldn’t validate program: ${this._gl.getProgramInfoLog(program)}`
      );
    }
    this._gl.useProgram(program);
    this._iGlobalTimeUniform = this._gl.getUniformLocation(program, "iTime")!;
    if (!this._iGlobalTimeUniform) {
      throw Error("Couldn’t find time uniform location in shader");
    }

    const vaoExt = this._gl.getExtension("OES_vertex_array_object");
    if (!vaoExt) {
      throw Error("No VAO extension");
    }
    const vao = vaoExt.createVertexArrayOES();
    vaoExt.bindVertexArrayOES(vao);
    const vbo = this._gl.createBuffer();
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
    this._gl.bufferData(
      this._gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1, -1]),
      this._gl.STATIC_DRAW
    );
    this._gl.vertexAttribPointer(0, 2, this._gl.FLOAT, false, 0, 0);
    this._gl.enableVertexAttribArray(0);

    this._gl.clearColor(0, 0, 0, 1);

    this._loop = this._loop.bind(this);
  }

  start() {
    this._running = true;
    requestAnimationFrame(this._loop);
  }

  stop() {
    this._running = false;
  }

  private _loop(ts: number) {
    // tslint:disable-next-line:no-bitwise
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    this._gl.uniform1f(this._iGlobalTimeUniform, ts / 1000);
    this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
    if (this._running) {
      requestAnimationFrame(this._loop);
    }
  }
}
