import { Directive, inject, input } from "@angular/core";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatOptionSelectionChange } from "@angular/material/core";
import { filter, Observable } from "rxjs";

/**
 * Keep an autocomplete dropdown open when the user selects one of its options,
 * so that several options can be selected without reopening the dropdown for each of them.
 *
 * Selecting an option is one of the "panel closing actions" of Angular Material's autocomplete
 * and there is no input to opt out of it. The trigger's stream of option selections (the only
 * closing action caused by a selection) is therefore replaced with a filtered one before
 * Material reads it through `panelClosingActions`.
 *
 * While the panel is kept open, Material does not run its own selection handling anymore,
 * which means the `optionSelected` output of the `mat-autocomplete` does not emit.
 * Listen to `onSelectionChange` of the individual `mat-option`s instead.
 */
@Directive({
  selector: "input[appKeepPanelOpenOnSelect]",
})
export class KeepPanelOpenOnSelectDirective {
  private readonly trigger = inject(MatAutocompleteTrigger, { self: true });

  /** whether the dropdown should stay open when the user selects an option */
  readonly keepPanelOpen = input(false, { alias: "appKeepPanelOpenOnSelect" });

  constructor() {
    // `optionSelections` is public but declared readonly, as replacing it is not a documented
    // use case. The dropdown specs assert the resulting behaviour to catch changes to this
    // internal in future Material versions.
    const trigger = this.trigger as {
      optionSelections: Observable<MatOptionSelectionChange>;
    };

    trigger.optionSelections = trigger.optionSelections.pipe(
      filter(() => !this.keepPanelOpen()),
    );
  }
}
