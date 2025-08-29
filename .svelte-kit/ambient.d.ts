
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const DATABASE_URL: string;
	export const OPENAI_API_KEY: string;
	export const CONDA_PROMPT_MODIFIER: string;
	export const TMUX: string;
	export const USER: string;
	export const npm_config_user_agent: string;
	export const BUN_INSTALL: string;
	export const OBSIDIAN_API_URL: string;
	export const npm_node_execpath: string;
	export const POWERLINE_COMMAND: string;
	export const SHLVL: string;
	export const WT_PROFILE_ID: string;
	export const npm_config_noproxy: string;
	export const HOME: string;
	export const OLDPWD: string;
	export const TERM_PROGRAM_VERSION: string;
	export const npm_package_json: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const VISUAL: string;
	export const npm_config_engine_strict: string;
	export const WSL_DISTRO_NAME: string;
	export const COLOR: string;
	export const NVM_DIR: string;
	export const WAYLAND_DISPLAY: string;
	export const LOGNAME: string;
	export const NAME: string;
	export const POSH_SESSION_ID: string;
	export const PULSE_SERVER: string;
	export const WSL_INTEROP: string;
	export const _: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const TERM: string;
	export const npm_config_cache: string;
	export const POSH_SHELL_VERSION: string;
	export const CLAUDE_AGENT_DIR: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const CLAUDE_HOME: string;
	export const WT_SESSION: string;
	export const XDG_RUNTIME_DIR: string;
	export const DISPLAY: string;
	export const HISTSIZE: string;
	export const LANG: string;
	export const TMUX_INDICATOR: string;
	export const TERM_PROGRAM: string;
	export const npm_lifecycle_script: string;
	export const SHELL: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const PYENV_VIRTUALENV_DISABLE_PROMPT: string;
	export const OSTYPE: string;
	export const POSH_THEME: string;
	export const SAVEHIST: string;
	export const ZLE_RPROMPT_INDENT: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const OBSIDIAN_API_KEY: string;
	export const PWD: string;
	export const npm_execpath: string;
	export const VIRTUAL_ENV_DISABLE_PROMPT: string;
	export const npm_config_global_prefix: string;
	export const npm_command: string;
	export const HISTFILE: string;
	export const TMUX_PLUGIN_MANAGER_PATH: string;
	export const HOSTTYPE: string;
	export const POSH_SHELL: string;
	export const TMUX_PANE: string;
	export const WSL2_GUI_APPS_ENABLED: string;
	export const EDITOR: string;
	export const WSLENV: string;
	export const INIT_CWD: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		DATABASE_URL: string;
		OPENAI_API_KEY: string;
		CONDA_PROMPT_MODIFIER: string;
		TMUX: string;
		USER: string;
		npm_config_user_agent: string;
		BUN_INSTALL: string;
		OBSIDIAN_API_URL: string;
		npm_node_execpath: string;
		POWERLINE_COMMAND: string;
		SHLVL: string;
		WT_PROFILE_ID: string;
		npm_config_noproxy: string;
		HOME: string;
		OLDPWD: string;
		TERM_PROGRAM_VERSION: string;
		npm_package_json: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		VISUAL: string;
		npm_config_engine_strict: string;
		WSL_DISTRO_NAME: string;
		COLOR: string;
		NVM_DIR: string;
		WAYLAND_DISPLAY: string;
		LOGNAME: string;
		NAME: string;
		POSH_SESSION_ID: string;
		PULSE_SERVER: string;
		WSL_INTEROP: string;
		_: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		TERM: string;
		npm_config_cache: string;
		POSH_SHELL_VERSION: string;
		CLAUDE_AGENT_DIR: string;
		npm_config_node_gyp: string;
		PATH: string;
		NODE: string;
		npm_package_name: string;
		CLAUDE_HOME: string;
		WT_SESSION: string;
		XDG_RUNTIME_DIR: string;
		DISPLAY: string;
		HISTSIZE: string;
		LANG: string;
		TMUX_INDICATOR: string;
		TERM_PROGRAM: string;
		npm_lifecycle_script: string;
		SHELL: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		PYENV_VIRTUALENV_DISABLE_PROMPT: string;
		OSTYPE: string;
		POSH_THEME: string;
		SAVEHIST: string;
		ZLE_RPROMPT_INDENT: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		OBSIDIAN_API_KEY: string;
		PWD: string;
		npm_execpath: string;
		VIRTUAL_ENV_DISABLE_PROMPT: string;
		npm_config_global_prefix: string;
		npm_command: string;
		HISTFILE: string;
		TMUX_PLUGIN_MANAGER_PATH: string;
		HOSTTYPE: string;
		POSH_SHELL: string;
		TMUX_PANE: string;
		WSL2_GUI_APPS_ENABLED: string;
		EDITOR: string;
		WSLENV: string;
		INIT_CWD: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
