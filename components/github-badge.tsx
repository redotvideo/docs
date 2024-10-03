import {useEffect, useState} from "react";
import {IconGithub} from "./icons/github";

export const GithubMenuBadge = () => (
	<a
		href="https://github.com/redotvideo/revideo"
		className="group h-8 flex shrink-0 flex-row items-center rounded border border-gray-200 dark:border-gray-800 overflow-hidden transition-opacity"
		target="_blank"
		rel="nofollow noreferrer"
		title="GitHub Repository"
	>
		<div className="py-1 px-1 block bg-gray-100 dark:bg-gray-900">
			<IconGithub className="group-hover:opacity-80 opacity-100 h-6 w-6" />
		</div>
		<div className="py-1 text-center text-sm group-hover:opacity-80 opacity-100 w-10">
			<StarCount />
		</div>
	</a>
);

export const StarCount = () => {
	const [stars, setStars] = useState<number | null>(null);

	useEffect(() => {
		if (!stars)
			fetch("https://api.github.com/repos/redotvideo/revideo")
				.then((response) => response.json())
				.then((data: unknown) => {
					if (typeof data === "object" && data !== null && "stargazers_count" in data) {
						const count = data.stargazers_count;
						if (typeof count === "number") {
							setStars(count);
						}
					}
				})
				.catch((error) => {
					console.error("Error fetching GitHub stars:", error);
				});
	}, []);

	return stars ? (
		<span>
			{(stars as number).toLocaleString("en-US", {
				compactDisplay: "short",
				notation: "compact",
			})}
		</span>
	) : null;
};
