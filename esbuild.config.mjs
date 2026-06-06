import esbuild from "esbuild";
import { rm } from "fs/promises";
import process from "process";
import bundleConfig from "./scripts/lib/esbuild-bundle-config.js";
import packagingContract from "./scripts/lib/packaging-contract.js";

const prod = (process.argv[2] === "production");
const {
	createMainBundleBuildOptions
} = bundleConfig;
const {
	RENDER_HOST_STANDALONE_OUTPUT_FILES
} = packagingContract;

async function removeStaleRenderHostOutputs() {
	await Promise.all(RENDER_HOST_STANDALONE_OUTPUT_FILES.map(async (relativePath) => {
		await rm(relativePath, { force: true });
	}));
}

await removeStaleRenderHostOutputs();

const context = await esbuild.context(createMainBundleBuildOptions({ prod }));

if (prod) {
	await context.rebuild();
	await context.dispose();
	process.exit(0);
} else {
	await context.watch();
}
