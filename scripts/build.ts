/// <reference lib="deno.ns" />

import * as esbuild from "npm:esbuild";

await esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    minify: Deno.args.includes("--no-dev"),
    outfile: `${Deno.args.includes("--no-dev") ? "dist" : "dev"}/fluid.js`,
    format: "esm"
    // globalName: "fluid"
});

await esbuild.build({
    entryPoints: ["src/ssr.ts"],
    bundle: true,
    minify: Deno.args.includes("--no-dev"),
    outfile: `${Deno.args.includes("--no-dev") ? "dist" : "dev"}/ssr.js`,
    format: "esm",
    // globalName: "fluid"
});

