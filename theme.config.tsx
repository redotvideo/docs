import {ThemeConfig} from "nextra";
import {Logo} from "./components/logo";
import {IconDiscord} from "./components/icons/discord";
import {GithubMenuBadge} from "./components/github-badge";
import {constants} from "./components/constants";
import {Pre} from "nextra/components";
import {DocsPlayer} from "./components/player";

export default {
	logo: <Logo />,
	sidebar: {
		defaultMenuCollapseLevel: 1,
	},
	docsRepositoryBase: "https://github.com/redotvideo/docs/tree/main",
	search: {
		placeholder: "Search...",
	},
	navbar: {
		extraContent: (
			<>
				<a
					className="p-1 hidden lg:inline-block hover:opacity-80"
					target="_blank"
					href={constants.discord}
					aria-label="Langfuse Discord"
				>
					<IconDiscord className="h-7 w-7" />
				</a>

				<a
					className="p-1 hidden sm:inline-block hover:opacity-80"
					target="_blank"
					href={constants.twitter}
					aria-label="Langfuse X formerly known as Twitter"
					rel="nofollow noreferrer"
				>
					<svg
						aria-label="X formerly known as Twitter"
						fill="currentColor"
						width="24"
						height="24"
						viewBox="0 0 24 22"
					>
						<path d="M16.99 0H20.298L13.071 8.26L21.573 19.5H14.916L9.702 12.683L3.736 19.5H0.426L8.156 10.665L0 0H6.826L11.539 6.231L16.99 0ZM15.829 17.52H17.662L5.83 1.876H3.863L15.829 17.52Z"></path>
					</svg>
				</a>

				<GithubMenuBadge />
			</>
		),
	},
	components: {
		pre: ({children, ...props}) => {
			// Check if the filename field is a valid JSON. If so, it's a player block.
			// If not, it's a regular code block.
			if (!props.filename) {
				return <Pre {...props}>{children}</Pre>;
			}

			let code = "";
			try {
				const metaInfo = JSON.parse(decodeURIComponent(props.filename));
				if (metaInfo.player) {
					console.log(metaInfo);
					props.filename = metaInfo.filename;
					code = metaInfo.code;
				}
			} catch (e) {
				// If JSON parsing fails, it's not a player block
				return <Pre {...props}>{children}</Pre>;
			}

			return <DocsPlayer preProps={props} preChildren={children} code={code} />;
		},
	},
} as ThemeConfig;
