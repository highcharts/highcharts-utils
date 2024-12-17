import { nodeResolve } from "@rollup/plugin-node-resolve";
export default {
    input: "./public/modules/edit.js",
    output: {
        file: "./public/modules/edit.bundle.js",
        format: "iife"
    },
    plugins: [nodeResolve()]
}