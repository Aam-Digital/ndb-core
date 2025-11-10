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
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NotificationRule } from "../model/notification-config";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatOption } from "@angular/material/core";
import { MatSelect } from "@angular/material/select";
import { JsonEditorDialogComponent } from "#src/app/core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from "@angular/material/expansion";
import { MatDialog } from "@angular/material/dialog";

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
    MatProgressSpinnerModule,
    MatOption,
    MatSelect,
    MatExpansionPanel,
    MatExpansionPanelHeader,
  ],
  templateUrl: "./notification-rule.component.html",
  styleUrl: "./notification-rule.component.scss",
})
export class NotificationRuleComponent implements OnChanges {
  @Input() value: NotificationRule;
  @Output() valueChange = new EventEmitter<NotificationRule>();

  @Output() removeNotificationRule = new EventEmitter<void>();

  form: FormGroup;
  entityTypeControl: AbstractControl;

  readonly dialog = inject(MatDialog);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.initForm();
    }
  }

  initForm() {
    this.form = new FormGroup({
      label: new FormControl(this.value?.label ?? ""),
      entityType: new FormControl({
        value: this.value?.entityType ?? "",
        disabled: Object.keys(this.value?.conditions ?? {}).length > 0,
      }),
      changeType: new FormControl(
        this.value?.changeType ?? ["created", "updated"],
      ),
      enabled: new FormControl(this.value?.enabled || false),
      conditions: new FormControl(this.value?.conditions ?? {}),
      notificationType: new FormControl(
        this.value?.notificationType ?? "entity_change",
      ),
    });
    this.entityTypeControl = this.form.get("entityType");

    this.updateEntityTypeControlState();
    this.form.valueChanges.subscribe((value) => this.updateValue(value));
  }

  /**
   * Disable the entityType field if there are notification conditions.
   */
  private updateEntityTypeControlState() {
    const conditionsControl = this.form.get("conditions");

    if (!conditionsControl) {
      return;
    }
    conditionsControl.valueChanges.subscribe((v) => {
      if (JSON.stringify(v) !== "{}") {
        this.entityTypeControl.disable();
      } else {
        this.entityTypeControl.enable();
      }
    });
  }

  private updateValue(value: any) {
    const entityTypeControl = this.form.get("entityType");
    if (entityTypeControl?.disabled) {
      value.entityType = entityTypeControl.value;
    }

    if (JSON.stringify(value) === JSON.stringify(this.value)) {
      // skip if no actual change
      return;
    }

    this.value = value;
    this.valueChange.emit(value);
  }

  /**
   * Open the conditions JSON editor popup.
   */
  openConditionsInJsonEditorPopup() {
    const conditionsForm = this.form.get("conditions");

    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: conditionsForm.value ?? {},
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      conditionsForm.setValue(result);
    });
  }
}
