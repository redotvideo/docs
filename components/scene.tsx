/** @jsxImportSource @revideo/2d/lib */
import {Rect, makeScene2D} from "@revideo/2d";
import {makeProject, waitFor} from "@revideo/core";

const scene = makeScene2D("main", function* (view) {
	yield view.add(<Rect height={100} width={100} fill={"red"} />);
	yield* waitFor(5);
});

export const project = makeProject({
	scenes: [scene],
});
