# From 0.3.x to 0.4.x

The release of v0.4 comes with the following breaking changes:

### renderVideo() accepts arguments as object and points to project file instead of vite config file

To make it easier to work with `renderVideo()` and `renderPartialVideo()`, the
functions now accept arguments as attributes of a `RenderVideoProps` /
`RenderPartialVideoProps` object.

Furthermore, they don't point to a `vite.config.ts` file anymore, but instead to
your video's project file, which is `./src/project.ts` by default.

In Revideo 0.3.x, you might have called `renderVideo()` like this:

```tsx
const file = await renderVideo(
  'vite.config.ts',
  {fill: 'orange'},
  {logProgress: true},
);
```

To update to 0.4.x, wrap your arguments in curly braces, add the name of the
argument as a key and replace `"vite.config.ts"`:

```tsx
const file = await renderVideo({
  projectFile: './src/project.ts',
  variables: {fill: 'orange'},
  settings: {logProgress: true},
});
```

Note that the following changes were made to the input arguments:

- in the `settings` object, "`name`", which refers to the name of the output
  file, was renamed to `outFile`. Also, you now have to append `.mp4` to
  `outFile`. In summary, if you previously had the argument `name: "myvideo"`,
  you should change it to `outFile: "myvideo.mp4"`.
- the `progressCallback` argument was moved inside of `settings`.

To check how you should structure your input arguments, you can take a look at
the `renderVideo()` [docs](/api/renderer/renderVideo).

### npx revideo serve serves the player through `localhost:4000/player` instead of `localhost:4000/player/project.js`.

In 0.3.x, when running `npx revideo serve`, you were previously able to obtain
the player from `localhost:4000/player/project.js` in order to pass it to the
`<Player/>`:

```tsx
<Player src="http://localhost:4000/player/project.js" controls={true} />
```

Now, in 0.4.x, you should just pass `localhost:4000/player` instead:

```tsx
<Player src="http://localhost:4000/player" controls={true} />
```

This change was made as we now start serving both the `project.js` file and the
assets. If you have files in the `/public` folder of your Revideo project, you
can now also use the assets from that project in another (NextJS) project that
uses the `<Player/>`.
