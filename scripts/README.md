# Conversion

This folder contains scripts to convert the old Revideo docs from their Docusaurus format to Nextra format. The old Docusaurus docs are located in the `docs-old` folder. The new Nexrtra docs are located in the /src/content/ folder. Example of the new docs structre with example content is in the `src/example-content` folder.

This is what needs to be done:

## Header

In the old docs, the header is like this:

```mdx
---
sidebar_position: 2
slug: /ffmpeg/concatenateMedia
---
```

In the new docs, we don't have custom slugs, so we need to figure out the new path based on where the mdx file is located. After that, we need to add a redirect from the old path to the new path. We keep that in an array called redirects to later add it to the redirects section of nextra config.

Sidebar positions are handled through \_meta.js files. These might look like this:

```js
export default {
	mdx: "",
	ssg: "",
	i18n: "",
	image: "",
	themes: "",
	latex: "",
};
```

The keys are the names paths to the mdx files in the same folder as the \_meta.js file. The order of the keys is the order of the sidebar items. The values are custom descriptions for the sidebar items. If the values are empty, the description will be the `#` of the first heading in the mdx file.
