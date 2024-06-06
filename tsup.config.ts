import { defineConfig } from "tsup";
 
export default defineConfig({
  entry: {
    //'index': "src/index.ts",
    'sbw_cli': "src/cli/index.ts",
  },
  publicDir: false,
  clean: true,
  target: ['es2020'],
  minify: false,
  dts: true,
  format: ['cjs', 'esm'], // When this changes, update 'type' in package.json 
});