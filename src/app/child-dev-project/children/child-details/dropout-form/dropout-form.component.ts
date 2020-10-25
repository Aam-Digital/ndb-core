import { Component, Input } from "@angular/core";
import { Child } from "../../model/child";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { AbstractControlOptions, FormBuilder } from "@angular/forms";
import { AlertService } from "../../../../core/alerts/alert.service";
import { FormSubcomponent } from "../form-subcomponent";

@Component({
  selector: "app-dropout-form",
  templateUrl: "./dropout-form.component.html",
  styleUrls: ["./dropout-form.component.scss"],
})
export class DropoutFormComponent extends FormSubcomponent {
  @Input() child: Child;

  public constructor(
    entityMapperService: EntityMapperService,
    fb: FormBuilder,
    alertService: AlertService
  ) {
    super(entityMapperService, fb, alertService);
  }

  getFormConfig(): {
    controlsConfig: { [p: string]: any };
    options?: AbstractControlOptions | { [p: string]: any } | null;
  } {
    return {
      controlsConfig: {
        dropoutDate: [
          { value: this.child.dropoutDate, disabled: !this.editing },
        ],
        dropoutType: [
          { value: this.child.dropoutType, disabled: !this.editing },
        ],
        dropoutRemarks: [
          { value: this.child.dropoutRemarks, disabled: !this.editing },
        ],
      },
    };
  }
}
