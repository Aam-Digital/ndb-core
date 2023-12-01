import { OnChanges, SimpleChange, SimpleChanges } from "@angular/core";

/**
 * Assigns the new value to the component input and calls ngOnChanges to simplify this in tests.
 *
 * Does not support actual "oldValue" in SimpleChange yet, as this is hardly ever needed.
 */
export function assignInputAndTriggerOnChanges(
  component: OnChanges,
  newInputValues: { [key: string]: any },
) {
  //const oldValue = component[inputName];
  Object.assign(component, newInputValues);

  let changes: SimpleChanges = {};
  for (const [key, value] of Object.entries(newInputValues)) {
    changes[key] = new SimpleChange(undefined, value, false);
  }
  component.ngOnChanges(changes);
}
