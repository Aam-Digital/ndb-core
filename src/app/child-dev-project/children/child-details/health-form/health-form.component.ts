import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Child } from "../../model/child";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { FormBuilder, FormGroup } from "@angular/forms";

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

  constructor(private entityMapper: EntityMapperService) {}

  save() {
    // Saving will save all the fields of the child, not just the health information
    // Undoing changes that were not saved yet can be done by re-entering the view
    this.entityMapper.save<Child>(this.child);
  }
}
