import type {Config} from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: [
		"./components/**/*.{js,jsx,ts,tsx,mdx}",
		"./pages/**/*.{js,jsx,ts,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/**/*.{js,jsx,ts,tsx,mdx}",
		"./theme.config.tsx",
		"./lib/**/*.{js,jsx,ts,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				gray: {
					50: "#FAFAFA",
					100: "#F3F3F3",
					200: "#E5E5E5",
					300: "#C7C7C7",
					400: "#ACACAC",
					500: "#808080",
					600: "#5F5F5F",
					700: "#4E4E4E",
					800: "#373737",
					900: "#2A2A2A",
					950: "#151515",
				},
				primary: {
					100: "#E9ECE5",
					300: "#D7DCD1",
				},
			},
		},
	},
};
export default config;
