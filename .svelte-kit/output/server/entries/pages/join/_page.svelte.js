import { G as push, O as push_element, Q as pop_element, K as pop, F as FILENAME } from "../../../chunks/index.js";
import "clsx";
import "../../../chunks/client.js";
import "../../../remote/xu03kg.js";
_page[FILENAME] = "src/routes/join/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  $$payload.out.push(`<div class="min-h-screen animated-gradient py-12 px-4">`);
  push_element($$payload, "div", 47, 0);
  $$payload.out.push(`<div class="max-w-4xl mx-auto">`);
  push_element($$payload, "div", 48, 1);
  $$payload.out.push(`<div class="bg-white rounded-lg shadow-xl p-8 mb-6">`);
  push_element($$payload, "div", 49, 2);
  $$payload.out.push(`<h1 class="text-3xl font-bold text-gray-800 mb-2">`);
  push_element($$payload, "h1", 50, 3);
  $$payload.out.push(`Active Sessions</h1>`);
  pop_element();
  $$payload.out.push(` <p class="text-gray-600">`);
  push_element($$payload, "p", 51, 3);
  $$payload.out.push(`Select a session to join</p>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8 text-center">`);
    push_element($$payload, "div", 61, 3);
    $$payload.out.push(`<div class="animate-pulse">`);
    push_element($$payload, "div", 62, 4);
    $$payload.out.push(`<div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4">`);
    push_element($$payload, "div", 63, 5);
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto">`);
    push_element($$payload, "div", 64, 5);
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]--> <div class="mt-8 text-center">`);
  push_element($$payload, "div", 137, 2);
  $$payload.out.push(`<a href="/" class="text-gray-600 hover:text-gray-800">`);
  push_element($$payload, "a", 138, 3);
  $$payload.out.push(`← Back to Home</a>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
