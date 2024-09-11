import { Component } from "@angular/core";
import { ViewDirective } from "../../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayLongText")
@Component({
  selector: "app-display-long-text",
  template: `<div [innerHTML]="formattedValue"></div>`,
  standalone: true,
})
export class DisplayLongTextComponent extends ViewDirective<string, string> {
  get formattedValue(): string {
    if (this.value === undefined) return "";

    const MaxLines = 4;
    const lines = this.value.split("\n");

    const truncatedText =
      lines.length > MaxLines
        ? lines.slice(0, MaxLines).join("<br>") + "..."
        : lines.join("<br>");
    return truncatedText;
  }
}
