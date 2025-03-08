# Conversion Scripts

This folder contains scripts to convert the old Revideo docs from their Docusaurus format to Nextra format.

## Setup

To set up the project, run:

```bash
npm install
```

## Running the Conversion

To run the conversion script:

```bash
npm run convert
```

This will:

1. Read the old Docusaurus docs from the `docs-old` folder
2. Convert them to Nextra format in the `/src/content/` folder
3. Generate redirects from old paths to new paths
4. Create `_meta.js` files for navigation

## Testing

The scripts are thoroughly tested using Jest. To run the tests:

```bash
npm test
```

For more details about the testing setup, see the [tests README](./tests/README.md).

## Code Structure

The main conversion logic is in `convert.ts`, which exports the following functions:

-   `removeInfoBlocks`: Removes info blocks from content
-   `createMetaFile`: Creates \_meta.js files for navigation
-   `processMdxFile`: Processes individual MDX files
-   `processDirectory`: Processes directories recursively
-   `main`: Orchestrates the conversion process

Each function is designed to be testable in isolation, with clear inputs and outputs.

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

## `:::` blocks

We use `:::` blocks to add notes, warnings, and other information to the docs. We need to convert these to `:::info` blocks in the new docs.

```mdx
:::info
This is an info block in the old docs.
:::
```

For now, we just remove these entirely. As you can see above, the possible keywords are `note`, `tip`, `info`, `caution`, `danger`, and `experimental`.
