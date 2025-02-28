import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CdkAccordionModule } from "@angular/cdk/accordion";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { BasicAutocompleteComponent } from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { NotificationRule } from "../../model/notification-config";

/**
 * Configure a single notification rule condition.
 */
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
  templateUrl: "./notification-condition.component.html",
  styleUrl: "../../notification-settings/notification-settings.component.scss",
})
export class NotificationConditionComponent implements OnInit {
  @Input() notificationRule: NotificationRule;

  @Input() form: FormGroup;

  @Output() removeNotificationCondition = new EventEmitter<any>();

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
  }
}

interface SimpleDropdownValue {
  label: string;
  value: string;
}

export interface NotificationRuleCondition {
  entityTypeField: string;
  operator: string;
  condition: string;
}
