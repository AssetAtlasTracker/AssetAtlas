import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const customTheme: CustomThemeConfig = {
	name: 'custom-theme',
	properties: {
		// =~= Theme Properties =~=
		"--theme-font-family-base": `system-ui`,
		"--theme-font-family-heading": `system-ui`,
		"--theme-font-color-base": "255 255 255",
		"--theme-font-color-dark": "255 255 255",
		"--theme-rounded-base": "8px",
		"--theme-rounded-container": "8px",
		"--theme-border-base": "2px",
		// =~= Theme On-X Colors =~=
		"--on-primary": "255 255 255",
		"--on-secondary": "255 255 255",
		"--on-tertiary": "255 255 255",
		"--on-success": "0 0 0",
		"--on-warning": "0 0 0",
		"--on-error": "255 255 255",
		"--on-surface": "255 255 255",
		// =~= Theme Colors  =~=
		// primary | #424b4c
		"--color-primary-50": "227 228 228", // #e3e4e4
		"--color-primary-100": "217 219 219", // #d9dbdb
		"--color-primary-200": "208 210 210", // #d0d2d2
		"--color-primary-300": "179 183 183", // #b3b7b7
		"--color-primary-400": "123 129 130", // #7b8182
		"--color-primary-500": "66 75 76", // #424b4c
		"--color-primary-600": "59 68 68", // #3b4444
		"--color-primary-700": "50 56 57", // #323839
		"--color-primary-800": "40 45 46", // #282d2e
		"--color-primary-900": "32 37 37", // #202525
		// secondary | #38595c 
		"--color-secondary-50": "225 230 231", // #e1e6e7
		"--color-secondary-100": "215 222 222", // #d7dede
		"--color-secondary-200": "205 214 214", // #cdd6d6
		"--color-secondary-300": "175 189 190", // #afbdbe
		"--color-secondary-400": "116 139 141", // #748b8d
		"--color-secondary-500": "56 89 92", // #38595c
		"--color-secondary-600": "50 80 83", // #325053
		"--color-secondary-700": "42 67 69", // #2a4345
		"--color-secondary-800": "34 53 55", // #223537
		"--color-secondary-900": "27 44 45", // #1b2c2d
		// tertiary | #045d42 
		"--color-tertiary-50": "217 231 227", // #d9e7e3
		"--color-tertiary-100": "205 223 217", // #cddfd9
		"--color-tertiary-200": "192 215 208", // #c0d7d0
		"--color-tertiary-300": "155 190 179", // #9bbeb3
		"--color-tertiary-400": "79 142 123", // #4f8e7b
		"--color-tertiary-500": "4 93 66", // #045d42
		"--color-tertiary-600": "4 84 59", // #04543b
		"--color-tertiary-700": "3 70 50", // #034632
		"--color-tertiary-800": "2 56 40", // #023828
		"--color-tertiary-900": "2 46 32", // #022e20
		// success | #51c8a4 
		"--color-success-50": "229 247 241", // #e5f7f1
		"--color-success-100": "220 244 237", // #dcf4ed
		"--color-success-200": "212 241 232", // #d4f1e8
		"--color-success-300": "185 233 219", // #b9e9db
		"--color-success-400": "133 217 191", // #85d9bf
		"--color-success-500": "81 200 164", // #51c8a4
		"--color-success-600": "73 180 148", // #49b494
		"--color-success-700": "61 150 123", // #3d967b
		"--color-success-800": "49 120 98", // #317862
		"--color-success-900": "40 98 80", // #286250
		// warning | #c98386 
		"--color-warning-50": "247 236 237", // #f7eced
		"--color-warning-100": "244 230 231", // #f4e6e7
		"--color-warning-200": "242 224 225", // #f2e0e1
		"--color-warning-300": "233 205 207", // #e9cdcf
		"--color-warning-400": "217 168 170", // #d9a8aa
		"--color-warning-500": "201 131 134", // #c98386
		"--color-warning-600": "181 118 121", // #b57679
		"--color-warning-700": "151 98 101", // #976265
		"--color-warning-800": "121 79 80", // #794f50
		"--color-warning-900": "98 64 66", // #624042
		// error | #b40427 
		"--color-error-50": "244 217 223", // #f4d9df
		"--color-error-100": "240 205 212", // #f0cdd4
		"--color-error-200": "236 192 201", // #ecc0c9
		"--color-error-300": "225 155 169", // #e19ba9
		"--color-error-400": "203 79 104", // #cb4f68
		"--color-error-500": "180 4 39", // #b40427
		"--color-error-600": "162 4 35", // #a20423
		"--color-error-700": "135 3 29", // #87031d
		"--color-error-800": "108 2 23", // #6c0217
		"--color-error-900": "88 2 19", // #580213
		// surface | #343b3c 
		"--color-surface-50": "225 226 226", // #e1e2e2
		"--color-surface-100": "214 216 216", // #d6d8d8
		"--color-surface-200": "204 206 206", // #cccece
		"--color-surface-300": "174 177 177", // #aeb1b1
		"--color-surface-400": "113 118 119", // #717677
		"--color-surface-500": "52 59 60", // #343b3c
		"--color-surface-600": "47 53 54", // #2f3536
		"--color-surface-700": "39 44 45", // #272c2d
		"--color-surface-800": "31 35 36", // #1f2324
		"--color-surface-900": "25 29 29", // #191d1d
	}
}