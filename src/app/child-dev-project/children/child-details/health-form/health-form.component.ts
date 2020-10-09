import { Component, Input } from "@angular/core";
import { Child } from "../../model/child";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";

@Component({
  selector: "app-health-form",
  templateUrl: "./health-form.component.html",
  styleUrls: ["./health-form.component.scss"],
})
export class HealthFormComponent {
  vaccinationStatusValues = [
    "Good",
    "Vaccination Due",
    "Needs Checking",
    "No Card/Information",
  ];
  eyeStatusValues = ["Good", "Has Glasses", "Needs Glasses", "Needs Checkup"];
  @Input() child: Child;
  editing: boolean = false;

  constructor(private entityMapper: EntityMapperService) {}

  save() {
    this.editing = false;
    this.entityMapper.save<Child>(this.child);
  }

  edit() {
    this.editing = true;
  }

  cancel() {
    this.editing = false;
    this.entityMapper
      .load<Child>(Child, this.child.getId())
      .then((tmpChild) => {
        this.child.health_vaccinationStatus = tmpChild.health_vaccinationStatus;
        this.child.health_eyeHealthStatus = tmpChild.health_eyeHealthStatus;
        this.child.health_bloodGroup = tmpChild.health_bloodGroup;
        this.child.health_lastDentalCheckup = tmpChild.health_lastDentalCheckup;
        this.child.health_lastEyeCheckup = tmpChild.health_lastEyeCheckup;
        this.child.health_lastENTCheckup = tmpChild.health_lastENTCheckup;
        this.child.health_lastVitaminD = tmpChild.health_lastVitaminD;
        this.child.health_lastDeworming = tmpChild.health_lastDeworming;
      });
  }
}
