import { Component } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayEmail")
@Component({
  selector: "app-display-email",
  template: `{{ value }}`,
})
export class DisplayEmailComponent extends ViewDirective<string> {}
