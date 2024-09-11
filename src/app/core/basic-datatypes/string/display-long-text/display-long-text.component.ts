import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayLongText")
@Component({
  selector: "app-display-long-text",
  template: `<div [innerHTML]="formattedValue"></div>`,
  standalone: true,
})
export class DisplayLongTextComponent
  extends ViewDirective<string, string>
  implements OnInit
{
  formattedValue: string = "";

  ngOnInit(): void {
    if (this.value === undefined) {
      this.formattedValue = "";
      return;
    }

    const maxLines = 4;
    const lines = this.value.split("\n");

    this.formattedValue =
      lines.length > maxLines
        ? lines.slice(0, maxLines).join("<br>") + "..."
        : lines.join("<br>");
  }
}
