import { expect } from "vitest";
import { entityMatchers } from "./entity-matchers";
import { formMatchers } from "./form-matchers";
import { genericMatchers } from "./generic-matchers";
import { mapMatchers } from "./map-matchers";

let isRegistered = false;

export function registerCustomMatchers(): void {
  if (isRegistered) {
    return;
  }

  expect.extend({
    ...entityMatchers,
    ...formMatchers,
    ...genericMatchers,
    ...mapMatchers,
  });

  isRegistered = true;
}
