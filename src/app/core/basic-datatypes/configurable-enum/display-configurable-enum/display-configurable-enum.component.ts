import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { NgClass, NgForOf, NgIf } from "@angular/common";

/**
 * This component displays a {@link ConfigurableEnumValue} as text.
 * If the value has a `color` property, it is used as the background color.
 */
@DynamicComponent("DisplayConfigurableEnum")
@Component({
  selector: "app-display-configurable-enum",
  templateUrl: "./display-configurable-enum.component.html",
  styleUrls: ["./display-configurable-enum.component.scss"],
  standalone: true,
  imports: [NgForOf, NgIf, NgClass],
})
export class DisplayConfigurableEnumComponent
  extends ViewDirective<ConfigurableEnumValue | ConfigurableEnumValue[]>
  implements OnInit
{
  iterableValue: ConfigurableEnumValue[] = [];

  ngOnInit() {
    this.initValue();
  }

  private initValue() {
    if (!this.value) {
      return;
    }

    if (Array.isArray(this.value)) {
      this.iterableValue = this.value;
    } else if (this.value) {
      this.iterableValue = [this.value];
    }
  }
}
