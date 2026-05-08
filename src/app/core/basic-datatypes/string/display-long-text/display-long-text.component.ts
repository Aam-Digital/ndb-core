import { Component, computed, ChangeDetectionStrategy } from "@angular/core";
import { ViewDirective } from "app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

/**
 * Config for details of how a long-text field should be displayed.
 * (define as "additional" on the entity field)
 */
export interface LongTextFieldConfig {
  /** Maximum number of lines to show */
  maxLines?: number;

  /** Maximum number of characters to show */
  maxCharacters?: number;
}

@DynamicComponent("DisplayLongText")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-long-text",
  template: `<div [innerHTML]="formattedValue()"></div>`,
  standalone: true,
})
export class DisplayLongTextComponent extends ViewDirective<
  string,
  LongTextFieldConfig
> {
  readonly formattedValue = computed(() => {
    const value = this.value();
    if (value === undefined) return "";

    const config = this.config();
    const maxLines = config?.maxLines ?? 3;
    const maxCharacters = config?.maxCharacters ?? 250;
    const text =
      value.length > maxCharacters
        ? value.slice(0, maxCharacters) + "..."
        : value;
    const lines = text.split("\n");
    return lines.length > maxLines
      ? lines.slice(0, maxLines).join("<br>") + "..."
      : lines.join("<br>");
  });
}
