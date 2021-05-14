import { OnInitDynamicComponent } from "../../../../view/dynamic-components/on-init-dynamic-component.interface";
import { AbstractControl } from "@angular/forms";

interface EditComponentConfig {
  id: string;
  tooltip?: string;
  placeholder: string;
  formControl: AbstractControl;
  enumId?: string;
}

export abstract class EditComponent implements OnInitDynamicComponent {
  tooltip: string;
  formControlName: string;
  placeholder: string;
  formControl: AbstractControl;
  enumId: string;
  onInitFromDynamicConfig(config: EditComponentConfig) {
    this.formControlName = config.id;
    this.tooltip = config.tooltip;
    this.placeholder = config.placeholder;
    this.formControl = config.formControl;
    this.enumId = config.enumId;
  }
}
