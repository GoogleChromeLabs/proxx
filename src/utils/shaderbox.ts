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

import { bind } from "./bind.js";

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
  scaling: number;
  timing: (ts: number) => number;
  uniforms: string[];
  antialias: boolean;
}
const defaultOpts: ShaderBoxOpts = {
  antialias: true,
  scaling: devicePixelRatio,
  timing: ts => ts,
  uniforms: []
};
export default class ShaderBox {
  readonly canvas: HTMLCanvasElement;
  private _gl: WebGLRenderingContext;
  private _running = false;
  private _opts: ShaderBoxOpts;
  private _uniformLocations = new Map<string, WebGLUniformLocation>();
  private _uniformValues = new Map<string, number[]>();

  constructor(
    private _vertexShader: string,
    private _fragmentShader: string,
    opts: Partial<ShaderBoxOpts> = {}
  ) {
    this._opts = {
      ...defaultOpts,
      ...opts,
      canvas: opts.canvas || document.createElement("canvas")
    };
    this.canvas = this._opts.canvas!;
    this._gl = this.canvas.getContext("webgl", {
      antialias: this._opts.antialias
    })!;
    if (!this._gl) {
      throw Error("No support for WebGL");
    }
    const program = this._gl!.createProgram();
    if (!program) {
      throw Error("Could not create program");
    }
    setShader(this._gl, program, this._gl.VERTEX_SHADER, this._vertexShader);
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

    this._opts.uniforms.push("iTime", "iResolution");
    for (const name of this._opts.uniforms) {
      const uniformLocation = this._gl.getUniformLocation(program, name)!;
      if (!uniformLocation) {
        console.error(`Couldn’t find uniform location of ${name}`);
        continue;
      }
      this._uniformLocations.set(name, uniformLocation);
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

    window.addEventListener("resize", this.resize);
  }

  start() {
    if (this._running) {
      return;
    }
    this._running = true;
    requestAnimationFrame(this._loop);
  }

  stop() {
    this._running = false;
  }

  @bind
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this._opts.scaling;
    this.canvas.height = rect.height * this._opts.scaling;
    this.setUniform2f("iResolution", [this.canvas.width, this.canvas.height]);
    console.log("Set size uniform to", this.canvas.width, this.canvas.height);
    this._gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  get uniforms() {
    return [...this._uniformLocations.keys()];
  }

  getUniform(name: string): number[] {
    this._assertUniformExists(name);
    return this._uniformValues.get(name)!;
  }

  setUniform1f(name: string, val: number) {
    this._gl.uniform1f(this._getUniformLocation(name), val);
    this._uniformValues.set(name, [val]);
  }

  setUniform2f(name: string, val: [number, number]) {
    this._gl.uniform2fv(this._getUniformLocation(name), val);
    this._uniformValues.set(name, val);
  }

  setUniform3f(name: string, val: [number, number, number]) {
    this._gl.uniform3fv(this._getUniformLocation(name), val);
    this._uniformValues.set(name, val);
  }

  setUniform4f(name: string, val: [number, number, number, number]) {
    this._gl.uniform4fv(this._getUniformLocation(name), val);
    this._uniformValues.set(name, val);
  }

  draw(ts: number = Date.now()) {
    // tslint:disable-next-line:no-bitwise
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    this.setUniform1f("iTime", this._opts.timing(ts));
    this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
  }

  @bind
  private _loop(ts: number) {
    this.draw(ts);
    if (this._running) {
      requestAnimationFrame(this._loop);
    }
  }

  private _assertUniformExists(name: string) {
    if (!this._uniformLocations.has(name)) {
      throw Error(`Unknown uniform ${name}`);
    }
  }
  private _getUniformLocation(name: string): WebGLUniformLocation {
    this._assertUniformExists(name);
    return this._uniformLocations.get(name)!;
  }
}


hasUniform(name) {
  return this._uniformLocations.has(name);
}

get uniforms() {
  return [...this._uniformLocations.keys()];
}

getUniform(name) {
  this._assertUniformExists(name);
  return this._uniformValues.get(name);
}

setUniform1f(name, val) {
  if(!this.hasUniform(name)) {
    return;
  }
  this._gl.uniform1f(this._getUniform(name), val);
  this._uniformValues.set(name, [val]);
}

setUniform2f(name, val) {
  if(!this.hasUniform(name)) {
    return;
  }
  this._gl.uniform2fv(this._getUniform(name), val);
  this._uniformValues.set(name, val);
}

setUniform3f(name, val) {
  if(!this.hasUniform(name)) {
    return;
  }
  this._gl.uniform3fv(this._getUniform(name), val);
  this._uniformValues.set(name, val);
}

setUniform4f(name, val) {
  if(!this.hasUniform(name)) {
    return;
  }
  this._gl.uniform4fv(this._getUniform(name), val);
  this._uniformValues.set(name, val);
}
