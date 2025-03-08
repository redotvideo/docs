import {removeInfoBlocks} from "../convert";

describe("removeInfoBlocks", () => {
	it("should remove info blocks from content", () => {
		const content = `
# Title

:::info
This is an info block.
:::

Some normal content.

:::tip
This is a tip block.
:::

More content.
`;

		const result = removeInfoBlocks(content);

		expect(result).not.toContain(":::info");
		expect(result).not.toContain(":::tip");
		expect(result).not.toContain("This is an info block.");
		expect(result).not.toContain("This is a tip block.");

		expect(result).toContain("# Title");
		expect(result).toContain("Some normal content.");
		expect(result).toContain("More content.");
	});

	it("should handle content without info blocks", () => {
		const content = `
# Title

Some normal content.

More content.
`;

		expect(removeInfoBlocks(content)).toBe(content);
	});

	it("should handle multiple nested info blocks", () => {
		const content = `
# Title

:::info
This is an info block.
Some more info.
:::

:::caution
This is a caution block.
:::

:::danger
This is a danger block.
:::
`;

		const result = removeInfoBlocks(content);

		expect(result).not.toContain(":::info");
		expect(result).not.toContain(":::caution");
		expect(result).not.toContain(":::danger");
		expect(result).not.toContain("This is an info block.");
		expect(result).not.toContain("This is a caution block.");
		expect(result).not.toContain("This is a danger block.");

		expect(result).toContain("# Title");
	});
});
