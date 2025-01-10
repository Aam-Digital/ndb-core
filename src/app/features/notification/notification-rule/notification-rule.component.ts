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
import { NotificationConditionComponent } from "./notification-condition/notification-condition.component";
import { MatDialog } from "@angular/material/dialog";
import { YesNoButtons } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { JsonEditorComponent } from "../json-editor/json-editor.component";

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

  notificationConditions: string[] = [];

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
      entityType: new FormControl(this.value?.entityType ?? ""),
      enabled: new FormControl(this.value?.enabled || false),
      // different format for form control
      channels: new FormControl(
        this.parseChannelsToOptionsArray(this.value?.channels),
      ),
      conditions: new FormArray([]),
      notificationType: new FormControl(
        this.value?.notificationType ?? "entity_change",
      ),
    });

    this.form.valueChanges.subscribe((value) => this.updateValue(value));
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

  removeCondition(conditionIndex: number) {
    (this.form.get("conditions") as FormArray).removeAt(conditionIndex);
    this.removeNotificationCondition.emit();
  }

  openConditionsInJsonEditorPopup() {
    // TODO
    // open MatDialog, passing in the current conditions property
    // dialog displays a new component with json editor
    // on dialogclose, update the conditions property with the dialogs return value
    const buttons = YesNoButtons;

    const dialogRef = this.dialog.open(JsonEditorComponent, {
      data: {
        title: "Notification Condition",
        conditions: {
          operator: "$gt",
          condition: "",
          entityTypeField: "date",
        },
        buttons: buttons,
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
}
