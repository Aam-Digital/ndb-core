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
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Logging } from "app/core/logging/logging.service";
import {
  NotificationChannel,
  NotificationRule,
  NotificationCondition,
} from "../model/notification-config";
import { MatOption } from "@angular/material/core";
import { MatSelect } from "@angular/material/select";
import { CdkAccordionModule } from "@angular/cdk/accordion";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { BasicAutocompleteComponent } from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";

/**
 * Configure a single notification rule.
 */
@Component({
  selector: "app-notification-rule",
  standalone: true,
  imports: [
    MatSlideToggle,
    MatInputModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    EntityTypeSelectComponent,
    HelpButtonComponent,
    ReactiveFormsModule,
    MatOption,
    MatSelect,
    CdkAccordionModule,
    EntityFieldSelectComponent,
    BasicAutocompleteComponent,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: NotificationRuleComponent },
  ],
  templateUrl: "./notification-rule.component.html",
  styleUrl: "../notification-settings/notification-settings.component.scss",
})
export class NotificationRuleComponent implements OnChanges, OnInit {
  @Input() value: NotificationRule;
  @Output() valueChange = new EventEmitter<NotificationRule>();

  @Output() valueNotificationConditionChange =
    new EventEmitter<NotificationRule>();

  @Output() removeNotificationRule = new EventEmitter<void>();

  @Output() removeNotificationCondition = new EventEmitter<any>();

  @Input() accordionIndex: number;

  form: FormGroup;

  notificationConditionForm: FormGroup;
  notificationCondition: NotificationCondition = null;
  conditionalOptions = null;
  conditionalValueMapper = null;

  notificationMethods: { key: NotificationChannel; label: string }[] = [
    { key: "push", label: $localize`:notification method option:Push` },
  ];

  private conditionMappings: Record<string, string> = {
    "Equal To": "$eq",
    "Greater Than": "$gt",
    "Greater Than or Equal To": "$gte",
    "Less Than": "$lt",
    "Less Than or Equal To": "$lte",
    "Not Equal To": "$ne",
    "In List": "$in",
    "Not In List": "$nin",
    AND: "$and",
    NOT: "$not",
    Neither: "$nor",
    OR: "$or",
    Exists: "$exists",
    "Has Type": "$type",
    "Where To": "$where",
  };

  ngOnInit(): void {
    this.conditionalOptions = Object.keys(this.conditionMappings);
    this.conditionalValueMapper = (value: string): string => {
      return this.conditionMappings[value];
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.initForm();
    }
  }

  private initForm() {
    this.form = new FormGroup({
      entityType: new FormControl(this.value?.entityType ?? ""),
      enabled: new FormControl(this.value?.enabled || false),
      // different format for form control
      channels: new FormControl(
        this.parseChannelsToOptionsArray(this.value?.channels),
      ),
      conditions: new FormControl(this.value?.conditions ?? []), // TODO: parse conditions format?
      // hidden fields
      notificationType: new FormControl(
        this.value?.notificationType ?? "entity_change",
      ),
    });

    this.notificationConditionForm = new FormGroup({
      entityTypeField: new FormControl(""),
      operator: new FormControl(""),
      condition: new FormControl(""),
    });

    this.form.valueChanges.subscribe((value) => this.updateValue(value));
    this.notificationConditionForm.valueChanges.subscribe((value) =>
      this.updateNotificationConditionValue(value),
    );
  }

  private updateValue(value: any) {
    value.channels = this.parseOptionsArrayToChannels(value.channels);

    if (JSON.stringify(value) === JSON.stringify(this.value)) {
      // skip if no actual change
      return;
    }

    this.value = value;
    this.valueChange.emit(value);
  }

  private updateNotificationConditionValue(value: any) {
    this.valueNotificationConditionChange.emit(value);
  }

  private parseChannelsToOptionsArray(channels?: {
    [key: string]: boolean;
  }): string[] {
    const parsedChannels = Object.entries(channels ?? [])
      .filter(([key, value]) => value === true)
      .map(([key, value]) => key);

    return parsedChannels
      .map((index) => this.notificationMethods[index]?.key)
      .filter((key) => key !== undefined);
  }

  private parseOptionsArrayToChannels(options: string[]): {
    [key: string]: boolean;
  } {
    const channels = {};
    for (let option in options ?? []) {
      channels[option] = true;
    }
    return channels;
  }

  /**
   * Sends a test notification.
   */
  async testNotification() {
    const NotificationToken = this.getNotificationToken();
    // TODO: Implement the test notification logic when the PR #2692 merged, and if the user have notificationToken then only trigger the API call to trigger the test notification.
    Logging.log("Notification settings test successful.");
  }

  private async getNotificationToken() {
    // TODO: Need to trigger the getNotificationToken(Implement this when the PR #2692 merged) function to allow the user to browser notification permission and update the notification token.
    Logging.log("Get the notification token.");
  }

  addNewNotificationCondition() {
    const newCondition = {
      entityTypeField: "",
      operator: "",
      condition: "",
    };

    if (!this.value.conditions) {
      this.value.conditions = [];
    }

    (this.value.conditions as any[]).push(newCondition);
  }

  removeCondition(conditionIndex: number) {
    this.value.conditions.splice(conditionIndex, 1);
    this.removeNotificationCondition.emit();
  }
}
