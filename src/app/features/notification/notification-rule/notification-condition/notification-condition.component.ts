import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CdkAccordionModule } from "@angular/cdk/accordion";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { BasicAutocompleteComponent } from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { NotificationRule } from "../../model/notification-config";

@Component({
  selector: "app-notification-condition",
  standalone: true,
  imports: [
    MatInputModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    CdkAccordionModule,
    EntityFieldSelectComponent,
    BasicAutocompleteComponent,
  ],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: NotificationConditionComponent,
    },
  ],
  templateUrl: "./notification-condition.component.html",
  styleUrl: "../../notification-settings/notification-settings.component.scss",
})
export class NotificationConditionComponent implements OnChanges, OnInit {
  @Input() notificationRule: NotificationRule;

  @Input() notificationConditionIndex: number;

  @Output() notificationConditionValueChange =
    new EventEmitter<NotificationRule>();

  @Output() removeNotificationCondition = new EventEmitter<any>();

  notificationConditionForm: FormGroup;
  conditionalOptions: SimpleDropdownValue[] = [];

  optionsToLabel = (v: SimpleDropdownValue) => this.conditionMappings[v.value];
  optionsToValue = (v: SimpleDropdownValue) =>
    Object.keys(this.conditionMappings).find(
      (key) => this.conditionMappings[key] === v.label,
    );

  private conditionMappings: Record<string, string> = {
    $eq: "Equal To",
    $gt: "Greater Than",
    $gte: "Greater Than or Equal To",
    $lt: "Less Than",
    $lte: "Less Than or Equal To",
    $ne: "Not Equal To",
    $in: "In List",
    $nin: "Not In List",
    $and: "AND",
    $not: "NOT",
    $nor: "Neither",
    $or: "OR",
    $exists: "Exists",
    $type: "Has Type",
    $where: "Where To",
  };

  ngOnInit(): void {
    this.conditionalOptions = Object.keys(this.conditionMappings).map(
      (key) => ({ label: this.conditionMappings[key], value: key }),
    );
    this.initNotificationConditionForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.initNotificationConditionForm();
    }
  }

  initNotificationConditionForm() {
    const condition =
      this.notificationRule?.conditions?.[this.notificationConditionIndex];

    this.notificationConditionForm = new FormGroup({
      entityTypeField: new FormControl(condition?.entityTypeField || ""),
      operator: new FormControl(condition?.operator || ""),
      condition: new FormControl(condition?.condition || ""),
    });

    this.notificationConditionForm.valueChanges.subscribe((value) => {
      this.updateNotificationConditionValue(value);
    });
  }

  private updateNotificationConditionValue(value: any) {
    Object.assign(
      this.notificationRule.conditions[this.notificationConditionIndex],
      value,
    );
    this.notificationConditionValueChange.emit(this.notificationRule);
  }

  isEntityTypeDisabled(notificationRule?: NotificationRule): boolean {
    return true;
  }
}

interface SimpleDropdownValue {
  label: string;
  value: string;
}
