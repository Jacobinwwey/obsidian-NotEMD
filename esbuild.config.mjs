import esbuild from "esbuild";
import { rm } from "fs/promises";
import path from "path";
import process from "process";
import bundleConfig from "./scripts/lib/esbuild-bundle-config.js";
import renderHostContract from "./scripts/lib/render-host-contract.js";

const prod = (process.argv[2] === "production");
const {
	createMainBundleBuildOptions
} = bundleConfig;
const {
	RENDER_HOST_STANDALONE_OUTPUT_FILES
} = renderHostContract;

async function removeStaleRenderHostOutputs() {
	await Promise.all(RENDER_HOST_STANDALONE_OUTPUT_FILES.map(async (relativePath) => {
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
