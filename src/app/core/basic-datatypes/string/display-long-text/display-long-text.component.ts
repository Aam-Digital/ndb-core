import { Component, Input, OnInit } from "@angular/core";
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
  selector: "app-display-long-text",
  template: `<div [innerHTML]="formattedValue"></div>`,
  standalone: true,
})
export class DisplayLongTextComponent
  extends ViewDirective<string, LongTextFieldConfig>
  implements OnInit
{
  @Input() declare config: LongTextFieldConfig;

  formattedValue: string = "";

  ngOnInit(): void {
    if (this.value === undefined) {
      this.formattedValue = "";
      return;
    }

    const maxLines = this.config?.maxLines ?? 3;
    const maxCharacters = this.config?.maxCharacters ?? 250;
    const text =
      this.value.length > maxCharacters
        ? this.value.slice(0, maxCharacters) + "..."
        : this.value;
    const lines = text.split("\n");
    this.formattedValue =
      lines.length > maxLines
        ? lines.slice(0, maxLines).join("<br>") + "..."
        : lines.join("<br>");
  }
}
