import typescript from "rollup-plugin-typescript2";
import nodeResolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import loadz0r from "rollup-plugin-loadz0r";

// Delete 'dist'
require("rimraf").sync("dist");

export default {
  input: ["src/bootstrap.ts", "src/worker.ts"],
  output: {
    dir: "dist",
    format: "amd",
    sourcemap: true
  },
  plugins: [
    typescript({
      // Make sure we are using our version of TypeScript.
      typescript: require("typescript"),
      tsconfigOverride: {
        compilerOptions: {
          sourceMap: true
        }
      }
    }),
    nodeResolve(),
    loadz0r()
    // terser()
  ]
};
