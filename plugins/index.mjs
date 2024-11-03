import {visit} from "unist-util-visit";

// See https://github.com/shuding/nextra/blob/c002118d8719f25e44dd1c2fc90b87272de20cb0/packages/nextra/src/server/rehype-plugins/rehype.ts#L44
// for the nextra implementation

export const parseExtendedMeta = () => (ast) => {
	visit(ast, {tagName: "pre"}, (node) => {
		const [codeEl] = node.children;
		const {meta = ""} = codeEl.data || {};

		const META_INCLUDES_PLAYER_REGEX = /(^|\s)player(\s|$)/;
		if (META_INCLUDES_PLAYER_REGEX.test(meta)) {
			// We encode the info if the player should be rendered into the filename since that seems to be one of the only
			// fields that is persisted through the MDX compilation process. This is a hacky solution but it works for now.

			// Extract the filename if it exists
			const filenameMatch = meta.match(/filename="([^"]+)"/);
			const filename = filenameMatch ? filenameMatch[1] : "";

			const metaInfo = {
				player: true,
				filename,
				code: codeEl.children[0].value,
			};

			// Append a marker to the filename, this gets handled in theme.config.tsx
			const newFilename = JSON.stringify(metaInfo);
			const newFilenameEscaped = encodeURIComponent(newFilename);

			// Update the meta string with the new filename, or add it if it doesn't exist
			const newMeta = filenameMatch
				? meta.replace(/filename="([^"]+)"/, `filename="${newFilenameEscaped}"`)
				: `${meta} filename="${newFilenameEscaped}"`.trim();
			codeEl.data.meta = newMeta;

			console.log("newMeta", newMeta);
		}
	});
};
