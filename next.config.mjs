import nextra from "nextra";
import {parseExtendedMeta} from "./plugins/index.mjs";

const withNextra = nextra({
	theme: "nextra-theme-docs",
	themeConfig: "./theme.config.tsx",
	defaultShowCopyCode: true,
	mdxOptions: {
		rehypePlugins: [[parseExtendedMeta, {}]],
	},
});

export default withNextra({
	transpilePackages: ["@revideo/2d", "@revideo/core", "@revideo/player-react"],
});
