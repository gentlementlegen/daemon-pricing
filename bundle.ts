import * as esbuild from "https://deno.land/x/esbuild@v0.25.2/mod.js";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.11.1";

const result = await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["src/index.ts"],
  outdir: "dist/",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "esnext",
  minify: true,
  sourcemap: true,
  treeShaking: true,
});

console.log(result);
await esbuild.stop();
