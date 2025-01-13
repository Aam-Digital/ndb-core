import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Logging } from "app/core/logging/logging.service";
import {
  NotificationChannel,
  NotificationRule,
} from "../model/notification-config";
import { MatOption } from "@angular/material/core";
import { MatSelect } from "@angular/material/select";
import { CdkAccordionItem, CdkAccordionModule } from "@angular/cdk/accordion";
import {
  NotificationConditionComponent,
  NotificationRuleCondition,
} from "./notification-condition/notification-condition.component";
import { DataFilter } from "../../../core/filter/filters/filters";
import { MatDialog } from "@angular/material/dialog";
import { NotificationConditionEditorComponent } from "./notification-condition/notification-condition-editor/notification-condition-editor.component";

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
    NotificationConditionComponent,
  ],
  templateUrl: "./notification-rule.component.html",
  styleUrl: "../notification-settings/notification-settings.component.scss",
})
export class NotificationRuleComponent implements OnChanges {
  @Input() value: NotificationRule;
  @Input() accordionIndex: number;
  @Output() valueChange = new EventEmitter<NotificationRule>();

  @Output() removeNotificationRule = new EventEmitter<void>();

  @Output() removeNotificationCondition = new EventEmitter<any>();

  @Output() notificationConditionValueChange =
    new EventEmitter<NotificationRule>();

  form: FormGroup;
  readonly dialog = inject(MatDialog);

  notificationMethods: { key: NotificationChannel; label: string }[] = [
    { key: "push", label: $localize`:notification method option:Push` },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.initForm();
    }
  }

  initForm() {
    this.form = new FormGroup({
      entityType: new FormControl({
        value: this.value?.entityType ?? "",
        disabled: Object.keys(this.value?.conditions ?? {}).length > 0,
      }),
      enabled: new FormControl(this.value?.enabled || false),
      // different format for form control
      channels: new FormControl(
        this.parseChannelsToOptionsArray(this.value?.channels),
      ),
      conditions: new FormArray(
        this.parseConditionsObjectToArray(this.value?.conditions).map(
          (c) =>
            new FormGroup({
              entityTypeField: new FormControl(c.entityTypeField),
              operator: new FormControl(c.operator),
              condition: new FormControl(c.condition),
            }),
        ),
      ),
      notificationType: new FormControl(
        this.value?.notificationType ?? "entity_change",
      ),
    });

    this.updateEntityTypeControlState();
    this.form.valueChanges.subscribe((value) => this.updateValue(value));
  }

  /**
   * Disable the entityType field if there are notification conditions.
   */
  private updateEntityTypeControlState() {
    this.form.get("conditions").valueChanges.subscribe(() => {
      const conditionsLength = (this.form.get("conditions") as FormArray)
        .length;
      const entityTypeControl = this.form.get("entityType");
      if (conditionsLength > 0) {
        entityTypeControl.disable();
      } else {
        entityTypeControl.enable();
      }
    });
  }

  private updateValue(value: any) {
    const entityTypeControl = this.form.get("entityType");
    if (entityTypeControl?.disabled) {
      value.entityType = entityTypeControl.value;
    }
    value.channels = this.parseOptionsArrayToChannels(value.channels);
    value.conditions = this.parseConditionsArrayToObject(value.conditions);

    if (JSON.stringify(value) === JSON.stringify(this.value)) {
      // skip if no actual change
      return;
    }

    this.value = value;
    this.valueChange.emit(value);
  }

  private parseChannelsToOptionsArray(channels?: {
    [key: string]: boolean;
  }): string[] {
    return Object.entries(channels ?? [])
      .filter(([key, value]) => value === true)
      .map(([key, value]) => key);
  }

  private parseOptionsArrayToChannels(options: string[]): {
    [key: string]: boolean;
  } {
    const channels = {};
    for (let option of options ?? []) {
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
    const newCondition = new FormGroup({
      entityTypeField: new FormControl(""),
      operator: new FormControl(""),
      condition: new FormControl(""),
    });
    (this.form.get("conditions") as FormArray).push(newCondition);
  }

  updateNotificationCondition(updateNotificationCondition: NotificationRule) {
    this.notificationConditionValueChange.emit(updateNotificationCondition);
  }

  removeCondition(notificationConditionIndex: number) {
    (this.form.get("conditions") as FormArray).removeAt(
      notificationConditionIndex,
    );
    this.removeNotificationCondition.emit();
  }

  openConditionsInJsonEditorPopup(): void {
    const dialogRef = this.dialog.open(NotificationConditionEditorComponent, {
      data: {
        value: this.form.get("conditions")?.value ?? {},
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log({ result });
      }
    });
  }

  handleToggleAccordion(notificationRuleItem: CdkAccordionItem) {
    if (!notificationRuleItem.expanded) {
      notificationRuleItem.toggle();
    }
  }

  /**
   * Parse from config format to a format that can be used in the form
   * e.g. from `{ fieldName: { '$eq': 'value' } }`
   * to `[ { entityTypeField: 'fieldName', operator: '$eq', condition: 'value' } ]`
   *
   * @param conditions
   * @private
   */
  private parseConditionsObjectToArray(
    conditions: DataFilter<any> | undefined,
  ): NotificationRuleCondition[] {
    if (!conditions) {
      return [];
    }

    return Object.entries(conditions).map(([entityField, condition]) => {
      const operator = Object.keys(condition)[0];
      return {
        entityTypeField: entityField,
        operator,
        condition: condition[operator],
      };
    });
  }

  /**
   * Transform form format back to the needed config entity format
   * e.g. from `[ { entityTypeField: 'fieldName', operator: '$eq', condition: 'value' } ]`
   * to { fieldName: { '$eq': 'value' } }`
   *
   * @param conditions
   * @private
   */
  private parseConditionsArrayToObject(
    conditions: NotificationRuleCondition[],
  ): DataFilter<any> {
    if (!conditions) {
      return {};
    }

    return conditions.reduce((acc, condition) => {
      if (
        !condition.entityTypeField ||
        !condition.operator ||
        condition.operator === "" ||
        !condition.condition ||
        condition.condition === ""
      ) {
        // continue without adding incomplete condition
        return acc;
      }

      acc[condition.entityTypeField] = {
        [condition.operator]: condition.condition,
      };
      return acc;
    }, {});
  }
}
