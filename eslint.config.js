import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import sveltePlugin from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";

export default [
	{
		files: ["**/*.{js,mjs,cjs,ts}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
			},
			globals: {
				...globals.browser,
				...globals.jest,
				...globals.node,
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			...pluginJs.configs.recommended.rules,
			...tseslint.configs.recommended.rules,
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"indent": ["warn", "tab", {
				"SwitchCase": 1,
				"ignoredNodes": [
					"TSTypeParameterInstantiation",
					"TSTypeParameterDeclaration",
					"TSUnionType",
					"TSIntersectionType"
				]
			}]
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				ecmaVersion: 2020,
				sourceType: "module",
			},
			globals: {
				...globals.browser,
				$state: "readonly",
				$derived: "readonly",
				$effect: "readonly",
				$props: "readonly",
				$bindable: "readonly",
				$inspect: "readonly",
			},
		},
		plugins: {
			svelte: sveltePlugin,
			"@typescript-eslint": tseslint,
		},
		rules: {
			...sveltePlugin.configs.recommended.rules,
			...tseslint.configs.recommended.rules,
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"indent": [
				"warn",
				"tab",
				{
					"SwitchCase": 1,
					"ignoredNodes": [
						"TSTypeParameterInstantiation",
						"TSTypeParameterDeclaration",
						"TSUnionType",
						"TSIntersectionType"
					]
				}
			],			
			"svelte/indent": ["warn", { "indent": "tab" }]
		},
	},
];