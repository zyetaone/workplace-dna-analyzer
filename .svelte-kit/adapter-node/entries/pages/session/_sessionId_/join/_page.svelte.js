import { G as push, O as push_element, Q as pop_element, K as pop, F as FILENAME } from "../../../../../chunks/index.js";
import "clsx";
import { p as page } from "../../../../../chunks/index2.js";
import "../../../../../chunks/client.js";
import "../../../../../remote/xu03kg.js";
_page[FILENAME] = "src/routes/session/[sessionId]/join/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  page.params.sessionId;
  $$payload.out.push(`<div class="min-h-screen animated-gradient flex items-center justify-center px-4">`);
  push_element($$payload, "div", 52, 0);
  $$payload.out.push(`<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">`);
  push_element($$payload, "div", 53, 1);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-center">`);
      push_element($$payload, "div", 89, 3);
      $$payload.out.push(`<p class="text-gray-600">`);
      push_element($$payload, "p", 90, 4);
      $$payload.out.push(`Loading session...</p>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div>`);
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
