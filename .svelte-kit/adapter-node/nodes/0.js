

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.Dt-_Dw_i.js","_app/immutable/chunks/z5RbBrQd.js","_app/immutable/chunks/CTvT9LFw.js"];
export const stylesheets = ["_app/immutable/assets/0.BFyXciWu.css"];
export const fonts = [];
