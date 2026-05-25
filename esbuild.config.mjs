import esbuild from "esbuild";
import process from "process";
import bundleConfig from "./scripts/lib/esbuild-bundle-config.js";

const prod = (process.argv[2] === "production");
const {
	createMainBundleBuildOptions
} = bundleConfig;

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
