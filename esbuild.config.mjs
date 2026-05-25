import esbuild from "esbuild";
import { rm } from "fs/promises";
import path from "path";
import process from "process";
import bundleConfig from "./scripts/lib/esbuild-bundle-config.js";

const prod = (process.argv[2] === "production");
const {
	createMainBundleBuildOptions
} = bundleConfig;

const STALE_RENDER_HOST_OUTPUTS = [
	"render-host.mjs",
	"render-host.html",
	"render-host.js",
	path.join("rendering-webview", "index.html")
];

async function removeStaleRenderHostOutputs() {
	await Promise.all(STALE_RENDER_HOST_OUTPUTS.map(async (relativePath) => {
		await rm(relativePath, { force: true });
	}));
}

await removeStaleRenderHostOutputs();

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	outfile: "main.js",
	...createMainBundleBuildOptions({ prod })
});

if (prod) {
	await context.rebuild();
	await context.dispose();
	process.exit(0);
} else {
	await context.watch();
}
