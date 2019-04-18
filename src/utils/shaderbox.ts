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

export function setShader(
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
}

type Color = [number, number, number, number];
interface Mesh {
  data?: ArrayBuffer;
  dimensions: number;
  name: string;
}

export interface ShaderBoxOpts {
  canvas?: HTMLCanvasElement;
  scaling: number;
  timing: (ts: number) => number;
  uniforms: string[];
  antialias: boolean;
  mesh: Mesh[];
  indices: number[];
  clearColor: Color;
}

const defaultOpts: ShaderBoxOpts = {
  antialias: true,
  scaling: devicePixelRatio,
  timing: ts => ts,
  uniforms: [],
  mesh: [
    {
      data: new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      dimensions: 2,
      name: "pos"
    }
  ],
  indices: [0, 1, 2, 2, 1, 3],
  clearColor: [1, 0, 0, 1]
};

export interface AddTextureOpts {
  interpolation: "LINEAR" | "NEAREST";
}

const defaultAddTextureOpts: AddTextureOpts = {
  interpolation: "LINEAR"
};

export default class ShaderBox {
  readonly canvas: HTMLCanvasElement;
  private _gl: WebGLRenderingContext;
  private _opts: ShaderBoxOpts;
  private _uniformLocations = new Map<string, WebGLUniformLocation>();
  private _uniformValues = new Map<string, number[]>();
  private _textures = new Map<string, WebGLTexture>();
  private _vbos = new Map<string, WebGLBuffer>();

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
    this._opts.uniforms = this._opts.uniforms.slice();

    this.canvas = this._opts.canvas!;
    this._gl = this.canvas.getContext("webgl", {
      antialias: this._opts.antialias
    })!;
    if (!this._gl) {
      throw Error("No support for WebGL");
    }
    const program = this._gl.createProgram();
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

    this._opts.uniforms.push("iResolution");
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
    for (const [idx, data] of this._opts.mesh.entries()) {
      const vbo = this._gl.createBuffer();
      if (!vbo) {
        throw Error("Could not create VBO");
      }
      this._vbos.set(data.name, vbo);
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
      this._gl.bufferData(
        this._gl.ARRAY_BUFFER,
        data.data || new Float32Array([]),
        this._gl.STATIC_DRAW
      );
      const loc = this._gl.getAttribLocation(program, data.name);
      this._gl.vertexAttribPointer(
        loc,
        data.dimensions,
        this._gl.FLOAT,
        false,
        0,
        0
      );
      this._gl.enableVertexAttribArray(loc);
    }

    const idxVbo = this._gl.createBuffer();
    this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, idxVbo);
    this._gl.bufferData(
      this._gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this._opts.indices),
      this._gl.STATIC_DRAW
    );

    this._gl.clearColor(...this._opts.clearColor);
  }

  updateVBO(name: string, data: ArrayBuffer) {
    this._assertVBOExists(name);
    const vbo = this._vbos.get(name)!;
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, data, this._gl.STATIC_DRAW);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this._opts.scaling;
    this.canvas.height = rect.height * this._opts.scaling;
    this.setUniform2f("iResolution", [rect.width, rect.height]);
    this._gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  hasUniform(name: string) {
    return this._uniformLocations.has(name);
  }

  get uniforms() {
    return [...this._uniformLocations.keys()];
  }

  getUniform(name: string) {
    this._assertUniformExists(name);
    return this._uniformValues.get(name);
  }

  setUniform1i(name: string, val: number) {
    if (!this.hasUniform(name)) {
      return;
    }
    this._gl.uniform1i(this._getUniformLocation(name), val);
    this._uniformValues.set(name, [val]);
  }

  setUniform1f(name: string, val: number) {
    if (!this.hasUniform(name)) {
      return;
    }
    this._gl.uniform1f(this._getUniformLocation(name), val);
    this._uniformValues.set(name, [val]);
  }

  setUniform2f(name: string, val: [number, number]) {
    if (!this.hasUniform(name)) {
      return;
    }
    this._gl.uniform2fv(this._getUniformLocation(name), val);
    this._uniformValues.set(name, val);
  }

  setUniform3f(name: string, val: [number, number, number]) {
    if (!this.hasUniform(name)) {
      return;
    }
    this._gl.uniform3fv(this._getUniformLocation(name), val);
    this._uniformValues.set(name, val);
  }

  setUniform4f(name: string, val: [number, number, number, number]) {
    if (!this.hasUniform(name)) {
      return;
    }
    this._gl.uniform4fv(this._getUniformLocation(name), val);
    this._uniformValues.set(name, val);
  }

  draw() {
    // tslint:disable-next-line:no-bitwise
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    this._gl.drawElements(
      this._gl.TRIANGLES,
      this._opts.indices.length,
      this._gl.UNSIGNED_SHORT,
      0
    );
  }

  getUniformNames(): string[] {
    return [...this._uniformLocations.keys()];
  }

  activateTexture(name: string, unit: number) {
    if (!this._textures.has(name)) {
      throw Error("Unknown texture name");
    }
    const texture = this._textures.get(name)!;
    this._gl.activeTexture((this as any)._gl[`TEXTURE${unit}`]);
    this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
  }

  addTexture(
    name: string,
    imageData: TexImageSource,
    userOpts: Partial<AddTextureOpts> = {}
  ) {
    const opts = { ...defaultAddTextureOpts, ...userOpts } as AddTextureOpts;

    if (!this._textures.has(name)) {
      const texture = this._gl.createTexture();
      if (!texture) {
        throw Error("Could not create texture");
      }
      this._textures.set(name, texture);
    }

    const texture = this._textures.get(name)!;
    this._gl.bindTexture(this._gl.TEXTURE_2D, texture);

    // Disable mipmapping
    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_MAG_FILTER,
      (this as any)._gl[opts.interpolation]
    );
    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_MIN_FILTER,
      (this as any)._gl[opts.interpolation]
    );
    // Repeat
    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_WRAP_S,
      this._gl.CLAMP_TO_EDGE
    );
    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_WRAP_T,
      this._gl.CLAMP_TO_EDGE
    );

    this._gl.texImage2D(
      this._gl.TEXTURE_2D,
      0,
      this._gl.RGBA,
      this._gl.RGBA,
      this._gl.UNSIGNED_BYTE,
      imageData
    );
  }

  private _assertVBOExists(name: string) {
    if (!this._vbos.has(name)) {
      throw Error(`Unknown VBO ${name}`);
    }
  }

  private _assertUniformExists(name: string) {
    if (!this._uniformLocations.has(name)) {
      throw Error(`Unknown uniform ${name}`);
    }
  }

  private _getUniformLocation(name: string) {
    this._assertUniformExists(name);
    return this._uniformLocations.get(name)!;
  }
}
