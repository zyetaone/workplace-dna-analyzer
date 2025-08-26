import { s as stores } from "./client.js";
import { _ as getContext } from "./index.js";
({
  check: stores.updated.check
});
function context() {
  return getContext("__request__");
}
const page$1 = {
  get error() {
    return context().page.error;
  },
  get params() {
    return context().page.params;
  },
  get status() {
    return context().page.status;
  }
};
const page = page$1;
export {
  page as p
};
