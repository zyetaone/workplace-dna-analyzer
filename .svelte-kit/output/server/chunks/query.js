import { get_request_store, with_request_store } from "@sveltejs/kit/internal/server";
import { c as create_remote_cache_key, a as stringify_remote_arg } from "./shared.js";
import { p as prerendering } from "./environment.js";
import { error } from "@sveltejs/kit";
function create_validator(validate_or_fn, maybe_fn) {
  if (!maybe_fn) {
    return (arg) => {
      if (arg !== void 0) {
        error(400, "Bad Request");
      }
    };
  }
  if (validate_or_fn === "unchecked") {
    return (arg) => arg;
  }
  if ("~standard" in validate_or_fn) {
    return async (arg) => {
      const { event, state } = get_request_store();
      const validate = validate_or_fn["~standard"].validate;
      const result = await validate(arg);
      if (result.issues) {
        error(
          400,
          await state.handleValidationError({
            issues: result.issues,
            event
          })
        );
      }
      return result.value;
    };
  }
  throw new Error(
    'Invalid validator passed to remote function. Expected "unchecked" or a Standard Schema (https://standardschema.dev)'
  );
}
function get_response(id, arg, state, get_result) {
  const cache_key = create_remote_cache_key(id, stringify_remote_arg(arg, state.transport));
  return (state.remote_data ??= {})[cache_key] ??= get_result();
}
async function run_remote_function(event, state, allow_cookies, arg, validate, fn) {
  const cleansed = {
    ...event,
    setHeaders: () => {
      throw new Error("setHeaders is not allowed in remote functions");
    },
    cookies: {
      ...event.cookies,
      set: (name, value, opts) => {
        if (!allow_cookies) {
          throw new Error("Cannot set cookies in `query` or `prerender` functions");
        }
        if (opts.path && !opts.path.startsWith("/")) {
          throw new Error("Cookies set in remote functions must have an absolute path");
        }
        return event.cookies.set(name, value, opts);
      },
      delete: (name, opts) => {
        if (!allow_cookies) {
          throw new Error("Cannot delete cookies in `query` or `prerender` functions");
        }
        if (opts.path && !opts.path.startsWith("/")) {
          throw new Error("Cookies deleted in remote functions must have an absolute path");
        }
        return event.cookies.delete(name, opts);
      }
    },
    route: { id: null },
    url: new URL(event.url.origin)
  };
  const validated = await with_request_store({ event: cleansed, state }, () => validate(arg));
  return with_request_store({ event: cleansed, state }, () => fn(validated));
}
// @__NO_SIDE_EFFECTS__
function command(validate_or_fn, maybe_fn) {
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = { type: "command", id: "", name: "" };
  const wrapper = (arg) => {
    const { event, state } = get_request_store();
    if (!event.isRemoteRequest) {
      throw new Error(
        `Cannot call a command (\`${__.name}(${maybe_fn ? "..." : ""})\`) during server-side rendering`
      );
    }
    state.refreshes ??= {};
    const promise = Promise.resolve(run_remote_function(event, state, true, arg, validate, fn));
    promise.updates = () => {
      throw new Error(`Cannot call '${__.name}(...).updates(...)' on the server`);
    };
    return (
      /** @type {ReturnType<RemoteCommand<Input, Output>>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  Object.defineProperty(wrapper, "pending", {
    get: () => 0
  });
  return wrapper;
}
// @__NO_SIDE_EFFECTS__
function query(validate_or_fn, maybe_fn) {
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = { type: "query", id: "", name: "" };
  const wrapper = (arg) => {
    if (prerendering) {
      throw new Error(
        `Cannot call query '${__.name}' while prerendering, as prerendered pages need static data. Use 'prerender' from $app/server instead`
      );
    }
    const { event, state } = get_request_store();
    const promise = get_response(
      __.id,
      arg,
      state,
      () => run_remote_function(event, state, false, arg, validate, fn)
    );
    promise.catch(() => {
    });
    promise.refresh = async () => {
      const { state: state2 } = get_request_store();
      const refreshes = state2.refreshes;
      if (!refreshes) {
        throw new Error(
          `Cannot call refresh on query '${__.name}' because it is not executed in the context of a command/form remote function`
        );
      }
      const cache_key = create_remote_cache_key(__.id, stringify_remote_arg(arg, state2.transport));
      refreshes[cache_key] = await /** @type {Promise<any>} */
      promise;
    };
    promise.withOverride = () => {
      throw new Error(`Cannot call '${__.name}.withOverride()' on the server`);
    };
    return (
      /** @type {RemoteQuery<Output>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  return wrapper;
}
export {
  command as a,
  create_validator as c,
  get_response as g,
  query as q,
  run_remote_function as r
};
