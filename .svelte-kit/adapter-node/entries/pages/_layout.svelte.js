import { G as push, N as head, O as push_element, Q as pop_element, K as pop, F as FILENAME } from "../../chunks/index.js";
_layout[FILENAME] = "src/routes/+layout.svelte";
function _layout($$payload, $$props) {
  push(_layout);
  let { children } = $$props;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Zyeta DX - Workplace Experience Platform</title>`;
    $$payload2.out.push(`<meta name="description" content="Transform workplace insights with real-time engagement and analytics powered by Zyeta DX"/>`);
    push_element($$payload2, "meta", 9, 1);
    pop_element();
    $$payload2.out.push(` <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>`);
    push_element($$payload2, "link", 13, 1);
    pop_element();
  });
  $$payload.out.push(`<!--[-->`);
  {
    $$payload.out.push(`<div class="animated-gradient min-h-screen">`);
    push_element($$payload, "div", 19, 1);
    children?.($$payload);
    $$payload.out.push(`<!----></div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
_layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _layout as default
};
