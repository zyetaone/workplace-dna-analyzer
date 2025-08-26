import { G as push, O as push_element, T as escape_html, Q as pop_element, K as pop, F as FILENAME } from "../../chunks/index.js";
import "clsx";
import { p as page } from "../../chunks/index2.js";
Error[FILENAME] = "node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte";
function Error($$payload, $$props) {
  push(Error);
  $$payload.out.push(`<h1>`);
  push_element($$payload, "h1", 5, 0);
  $$payload.out.push(`${escape_html(page.status)}</h1>`);
  pop_element();
  $$payload.out.push(` <p>`);
  push_element($$payload, "p", 6, 0);
  $$payload.out.push(`${escape_html(page.error?.message)}</p>`);
  pop_element();
  pop();
}
Error.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  Error as default
};
