import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../../../view/dynamic-components/on-init-dynamic-component.interface";
import { AbstractControl } from "@angular/forms";

@Component({
  selector: "app-textfield",
  templateUrl: "./textfield.component.html",
  styleUrls: ["./textfield.component.scss"],
})
export class TextfieldComponent implements OnInitDynamicComponent {
  tooltip: string;
  formControlName: string;
  placeholder: string;
  formControl: AbstractControl;

  constructor() {}

  onInitFromDynamicConfig(config: any) {
    this.formControlName = config["id"];
    this.tooltip = config["tooltip"];
    this.placeholder = config["placeholder"];
    this.formControl = config["formControl"];
  }
}
