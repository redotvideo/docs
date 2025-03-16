# Conversion

This folder contains scripts to convert the old Revideo docs from their Docusaurus format to Nextra format. The old Docusaurus docs are located in the `docs-old` folder. The new Nexrtra docs are located in the /src/content/ folder. Example of the new docs structre with example content is in the `src/example-content` folder.

## Running the Conversion

To run the conversion script:

```bash
npm install  # Install dependencies (only needed once)
npm run convert
```

## Testing

The conversion script includes automated tests to ensure it works correctly. To run the tests:

```bash
npm test
```

See the [tests README](./__tests__/README.md) for more details on the test coverage.

## Conversion Process

This is what needs to be done:

### Header

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

### `:::` blocks

We use `:::` blocks to add notes, warnings, and other information to the docs. These need to be converted to Nextra's callout syntax. For example, this block in the old docs:

```mdx
:::info
This is an info block in the old docs.
:::
```

Should be converted to:

```mdx
> [!INFO]
>
> This is an info block in the old docs.
```

The mapping of block types is as follows:

-   `:::note` → `> [!NOTE]`
-   `:::tip` → `> [!TIP]`
-   `:::info` → `> [!INFO]`
-   `:::caution` → `> [!CAUTION]`
-   `:::danger` → `> [!DANGER]`
-   `:::experimental` → `> [!WARNING]` (we map experimental to warning as it's the closest match)

### Directories that don't have mdx files

If a directory doesn't have an mdx file, it should be ignored. As an example, we might have this situation:

```
docs-old/
├── code/
│   ├── filters-and-effects/
│   │   ├── blur.tsx
│   │   ├── brightness.tsx
│   ├── tsconfig.json
```

In this case, we should not copy anything from the `code` directory and the \_meta.js file inside `docs-old` should not have anything related to the `code` directory.

### Code blocks

Code blocks sometimes use attributes like `mode=preview` or `title="src/project.ts"`. We should remove these attributes as they are not supported in Nextra.

### React imports and components

We use React components in the old docs. While we're working on migrating these, we should just strip them out.

In this example page:

````mdx
import AnimationPlayer from "@site/src/components/AnimationPlayer";
import ApiSnippet from "@site/src/components/Api/ApiSnippet";

# Example Page

This is an example paragraph.

<AnimationPlayer name="layout" banner />

This is example paragraph number 2.

```tsx
<Rect layout>
	<Circle width={320} height={320} />
</Rect>
```
````

### Links between pages

Right now when linking to another page from an old page, we use the url from the slug (found at the top of the mdx file). Nextra uses the folder structure to determine the url. We need to update all the links to use the new folder structure.
