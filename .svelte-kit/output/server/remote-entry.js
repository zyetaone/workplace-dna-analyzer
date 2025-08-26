import { r as run_remote_function, c as create_validator, g as get_response } from "./chunks/query.js";
import { a, q } from "./chunks/query.js";
import { get_request_store } from "@sveltejs/kit/internal/server";
import { json } from "@sveltejs/kit";
import { D as DEV } from "./chunks/true.js";
import { a as stringify_remote_arg, s as stringify } from "./chunks/shared.js";
import { b as base, c as app_dir } from "./chunks/paths.js";
// @__NO_SIDE_EFFECTS__
function form(fn) {
  function create_instance(key) {
    const instance = {};
    instance.method = "POST";
    instance.onsubmit = () => {
    };
    Object.defineProperty(instance, "enhance", {
      value: () => {
        return { action: instance.action, method: instance.method, onsubmit: instance.onsubmit };
      }
    });
    const button_props = {
      type: "submit",
      onclick: () => {
      }
    };
    Object.defineProperty(button_props, "enhance", {
      value: () => {
        return { type: "submit", formaction: instance.buttonProps.formaction, onclick: () => {
        } };
      }
    });
    Object.defineProperty(instance, "buttonProps", {
      value: button_props
    });
    const __ = {
      type: "form",
      name: "",
      id: "",
      /** @param {FormData} form_data */
      fn: async (form_data) => {
        const { event, state } = get_request_store();
        state.refreshes ??= {};
        const result = await run_remote_function(event, state, true, form_data, (d) => d, fn);
        if (!event.isRemoteRequest) {
          (state.remote_data ??= {})[__.id] = result;
        }
        return result;
      }
    };
    Object.defineProperty(instance, "__", { value: __ });
    Object.defineProperty(instance, "action", {
      get: () => `?/remote=${__.id}`,
      enumerable: true
    });
    Object.defineProperty(button_props, "formaction", {
      get: () => `?/remote=${__.id}`,
      enumerable: true
    });
    Object.defineProperty(instance, "result", {
      get() {
        try {
          const { remote_data } = get_request_store().state;
          return remote_data?.[__.id];
        } catch {
          return void 0;
        }
      }
    });
    Object.defineProperty(instance, "pending", {
      get: () => 0
    });
    Object.defineProperty(button_props, "pending", {
      get: () => 0
    });
    if (key == void 0) {
      Object.defineProperty(instance, "for", {
        /** @type {RemoteForm<any>['for']} */
        value: (key2) => {
          const { state } = get_request_store();
          let instance2 = (state.form_instances ??= /* @__PURE__ */ new Map()).get(key2);
          if (!instance2) {
            instance2 = create_instance(key2);
            instance2.__.id = `${__.id}/${encodeURIComponent(JSON.stringify(key2))}`;
            instance2.__.name = __.name;
            state.form_instances.set(key2, instance2);
          }
          return instance2;
        }
      });
    }
    return instance;
  }
  return create_instance();
}
// @__NO_SIDE_EFFECTS__
function prerender(validate_or_fn, fn_or_options, maybe_options) {
  const maybe_fn = typeof fn_or_options === "function" ? fn_or_options : void 0;
  const options = maybe_options ?? (maybe_fn ? void 0 : fn_or_options);
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = {
    type: "prerender",
    id: "",
    name: "",
    has_arg: !!maybe_fn,
    inputs: options?.inputs,
    dynamic: options?.dynamic
  };
  const wrapper = (arg) => {
    const promise = (async () => {
      const { event, state } = get_request_store();
      const payload = stringify_remote_arg(arg, state.transport);
      const id = __.id;
      const url = `${base}/${app_dir}/remote/${id}${payload ? `/${payload}` : ""}`;
      if (!state.prerendering && !DEV) ;
      if (state.prerendering?.remote_responses.has(url)) {
        return (
          /** @type {Promise<any>} */
          state.prerendering.remote_responses.get(url)
        );
      }
      const promise2 = get_response(
        id,
        arg,
        state,
        () => run_remote_function(event, state, false, arg, validate, fn)
      );
      if (state.prerendering) {
        state.prerendering.remote_responses.set(url, promise2);
      }
      const result = await promise2;
      if (state.prerendering) {
        const body = { type: "result", result: stringify(result, state.transport) };
        state.prerendering.dependencies.set(url, {
          body: JSON.stringify(body),
          response: json(body)
        });
      }
      return result;
    })();
    promise.catch(() => {
    });
    return (
      /** @type {RemoteResource<Output>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  return wrapper;
}
export {
  a as command,
  form,
  prerender,
  q as query
};
