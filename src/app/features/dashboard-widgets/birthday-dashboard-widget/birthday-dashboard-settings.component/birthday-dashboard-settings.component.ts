import { Component, Input, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { FormControl, FormsModule } from "@angular/forms";

export interface BirthdayDashboardSettingsConfig {
  /**
   * How many days in advance an upcoming birthday/anniversary should be displayed.
   */
  threshold?: number;
  
  /**
   * Map of entity type(s) and the "date-with-age" field within the type
   * that should be scanned for upcoming anniversaries.
   * e.g. `{ "Child": "dateOfBirth", "School": "foundingDate" }`
   */
  entities?: { [entitType: string]: string };
}

@Component({
  selector: "app-birthday-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
  ],
  templateUrl: "./birthday-dashboard-settings.component.html",
  styleUrls: ["./birthday-dashboard-settings.component.scss"],
})
export class BirthdayDashboardSettingsComponent implements OnInit {
  @Input() formControl: FormControl<BirthdayDashboardSettingsConfig>;

  localConfig: BirthdayDashboardSettingsConfig = {
    threshold: 32,
    entityType: "Child",
    birthdayProperty: "dateOfBirth",
  };

  ngOnInit() {
    this.localConfig = {
      threshold: this.formControl.value?.threshold ?? 32,
      entityType: this.formControl.value?.entityType ?? "Child",
      birthdayProperty:
        this.formControl.value?.birthdayProperty ?? "dateOfBirth",
    };
  }

  emitConfigChange() {
    this.formControl.setValue({ ...this.localConfig });
  }
}
