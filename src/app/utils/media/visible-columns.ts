import { inject, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import {
  ScreenSize,
  ScreenWidthObserver,
} from "./screen-size-observer.service";

/**
 * The current screen size as a signal, updated whenever the screen width crosses a breakpoint.
 *
 * Must be called in an injection context (e.g. a field initializer of a component).
 */
export function injectCurrentScreenSize(): Signal<ScreenSize> {
  const screenWidthObserver = inject(ScreenWidthObserver);
  return toSignal(
    screenWidthObserver
      .shared()
      .pipe(map(() => screenWidthObserver.currentScreenSize())),
    { initialValue: screenWidthObserver.currentScreenSize() },
  );
}

/**
 * Ids of the table columns to be displayed on the given screen size,
 * leaving out columns with `hideFromTable` and those configured `visibleFrom` a larger screen size only.
 */
export function getVisibleColumnIds(
  columns: FormFieldConfig[],
  screenSize: ScreenSize,
): string[] {
  return columns
    .filter((column) => {
      if (column?.hideFromTable) return false;
      const numericValue = ScreenSize[column?.visibleFrom];
      if (numericValue === undefined) return true;
      return screenSize >= numericValue;
    })
    .map((c) => c.id);
}
