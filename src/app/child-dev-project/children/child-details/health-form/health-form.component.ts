import { Component, Input } from "@angular/core";
import { Child } from "../../model/child";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { FormSubcomponent } from "../form-subcomponent";
import { AbstractControlOptions, FormBuilder } from "@angular/forms";
import { AlertService } from "../../../../core/alerts/alert.service";

@Component({
  selector: "app-health-form",
  templateUrl: "./health-form.component.html",
  styleUrls: ["./health-form.component.scss"],
})
export class HealthFormComponent extends FormSubcomponent {
  vaccinationStatusValues = [
    "Good",
    "Vaccination Due",
    "Needs Checking",
    "No Card/Information",
  ];
  eyeStatusValues = ["Good", "Has Glasses", "Needs Glasses", "Needs Checkup"];
  @Input() child: Child;
  editing: boolean = false;

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
        health_vaccinationStatus: [
          {
            value: this.child.health_vaccinationStatus,
            disabled: !this.editing,
          },
        ],
        health_eyeHealthStatus: [
          { value: this.child.health_eyeHealthStatus, disabled: !this.editing },
        ],
        health_bloodGroup: [
          { value: this.child.health_bloodGroup, disabled: !this.editing },
        ],
        health_lastDentalCheckup: [
          {
            value: this.child.health_lastDentalCheckup,
            disabled: !this.editing,
          },
        ],
        health_lastEyeCheckup: [
          { value: this.child.health_lastEyeCheckup, disabled: !this.editing },
        ],
        health_lastENTCheckup: [
          { value: this.child.health_lastENTCheckup, disabled: !this.editing },
        ],
        health_lastVitaminD: [
          { value: this.child.health_lastVitaminD, disabled: !this.editing },
        ],
        health_lastDeworming: [
          { value: this.child.health_lastDeworming, disabled: !this.editing },
        ],
      },
    };
  }
}
