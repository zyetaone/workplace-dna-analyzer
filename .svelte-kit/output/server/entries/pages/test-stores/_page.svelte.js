import { G as push, Y as ensure_array_like, O as push_element, Q as pop_element, T as escape_html, V as attr, K as pop, F as FILENAME } from "../../../chunks/index.js";
import { s as sessionStore, a as analyticsStore } from "../../../chunks/analytics-state.svelte.js";
import "../../../remote/xu03kg.js";
_page[FILENAME] = "src/routes/test-stores/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  let loading = false;
  let currentSession = sessionStore.currentSession;
  let currentAttendees = sessionStore.currentAttendees;
  let completedAttendees = sessionStore.completedAttendees;
  let activeCount = analyticsStore.activeCount;
  let completedCount = analyticsStore.completedCount;
  let preferenceScores = analyticsStore.preferenceScores;
  const each_array = ensure_array_like(currentAttendees);
  $$payload.out.push(`<div class="p-8">`);
  push_element($$payload, "div", 73, 0);
  $$payload.out.push(`<h1 class="text-2xl font-bold mb-4">`);
  push_element($$payload, "h1", 74, 1);
  $$payload.out.push(`Store Test Page</h1>`);
  pop_element();
  $$payload.out.push(` <div class="mb-4">`);
  push_element($$payload, "div", 76, 1);
  $$payload.out.push(`<p class="font-semibold">`);
  push_element($$payload, "p", 77, 2);
  $$payload.out.push(`Session ID: 8ff9174e-3c53-4fb5-a7dd-8c45d4bbaa3c</p>`);
  pop_element();
  $$payload.out.push(` <p>`);
  push_element($$payload, "p", 78, 2);
  $$payload.out.push(`Loading: ${escape_html(loading)}</p>`);
  pop_element();
  $$payload.out.push(` `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  $$payload.out.push(` <div class="grid grid-cols-2 gap-4 mb-4">`);
  push_element($$payload, "div", 84, 1);
  $$payload.out.push(`<button${attr("disabled", loading, true)} class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">`);
  push_element($$payload, "button", 85, 2);
  $$payload.out.push(`Load Session</button>`);
  pop_element();
  $$payload.out.push(` <button${attr("disabled", loading, true)} class="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50">`);
  push_element($$payload, "button", 92, 2);
  $$payload.out.push(`Refresh Session</button>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="space-y-4">`);
  push_element($$payload, "div", 101, 1);
  $$payload.out.push(`<div class="p-4 border rounded">`);
  push_element($$payload, "div", 102, 2);
  $$payload.out.push(`<h2 class="font-semibold mb-2">`);
  push_element($$payload, "h2", 103, 3);
  $$payload.out.push(`Session Store State:</h2>`);
  pop_element();
  $$payload.out.push(` <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">`);
  push_element($$payload, "pre", 104, 3);
  $$payload.out.push(`
Current Session: ${escape_html(JSON.stringify(currentSession, null, 2))}
Current Attendees: ${escape_html(currentAttendees.length)}
Completed Attendees: ${escape_html(completedAttendees.length)}
			</pre>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="p-4 border rounded">`);
  push_element($$payload, "div", 111, 2);
  $$payload.out.push(`<h2 class="font-semibold mb-2">`);
  push_element($$payload, "h2", 112, 3);
  $$payload.out.push(`Analytics Store State:</h2>`);
  pop_element();
  $$payload.out.push(` <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">`);
  push_element($$payload, "pre", 113, 3);
  $$payload.out.push(`
Active Count: ${escape_html(activeCount)}
Completed Count: ${escape_html(completedCount)}
Preference Scores: ${escape_html(JSON.stringify(preferenceScores, null, 2))}
			</pre>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="p-4 border rounded">`);
  push_element($$payload, "div", 120, 2);
  $$payload.out.push(`<h2 class="font-semibold mb-2">`);
  push_element($$payload, "h2", 121, 3);
  $$payload.out.push(`Attendees Detail:</h2>`);
  pop_element();
  $$payload.out.push(` <!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let attendee = each_array[$$index];
    $$payload.out.push(`<div class="mb-2 p-2 bg-gray-50 rounded">`);
    push_element($$payload, "div", 123, 4);
    $$payload.out.push(`<p class="font-medium">`);
    push_element($$payload, "p", 124, 5);
    $$payload.out.push(`${escape_html(attendee.name)}</p>`);
    pop_element();
    $$payload.out.push(` <p class="text-sm">`);
    push_element($$payload, "p", 125, 5);
    $$payload.out.push(`Completed: ${escape_html(attendee.completed)}</p>`);
    pop_element();
    $$payload.out.push(` <p class="text-sm">`);
    push_element($$payload, "p", 126, 5);
    $$payload.out.push(`Scores: ${escape_html(JSON.stringify(attendee.preferenceScores))}</p>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]--></div>`);
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
