import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  model,
  output,
} from "@angular/core";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatOption } from "@angular/material/core";
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelect } from "@angular/material/select";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { ConditionsEditorComponent } from "app/core/common-components/conditions-editor/conditions-editor.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityConstructor } from "app/core/entity/model/entity";
import { IconButtonComponent } from "../../../core/common-components/icon-button/icon-button.component";
import { NotificationRule } from "../model/notification-config";

/**
 * Configure a single notification rule.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    IconButtonComponent,
    ConditionsEditorComponent,
  ],
  templateUrl: "./notification-rule.component.html",
  styleUrl: "./notification-rule.component.scss",
})
export class NotificationRuleComponent {
  value = model<NotificationRule>();
  removeNotificationRule = output<void>();

  form: FormGroup;
  entityTypeControl: AbstractControl;
  entityConstructor: EntityConstructor | null = null;

  private readonly entityRegistry = inject(EntityRegistry);

  constructor() {
    effect(() => {
      if (this.value()) {
        this.initForm();
      }
    });
  }

  initForm() {
    const value = this.value();
    if (!value) {
      return;
    }

    this.form = new FormGroup({
      label: new FormControl(value.label ?? ""),
      entityType: new FormControl({
        value: value.entityType ?? "",
        disabled: Object.keys(value.conditions ?? {}).length > 0,
      }),
      changeType: new FormControl(value.changeType ?? ["created", "updated"]),
      enabled: new FormControl(value.enabled || false),
      conditions: new FormControl(value.conditions ?? {}),
      notificationType: new FormControl(
        value.notificationType ?? "entity_change",
      ),
    });

    this.entityTypeControl = this.form.get("entityType");
    this.updateEntityConstructor(this.entityTypeControl.value);
    this.entityTypeControl.valueChanges.subscribe((entityType) =>
      this.updateEntityConstructor(entityType),
    );

    this.updateEntityTypeControlState();
    this.form.valueChanges.subscribe((newValue) => this.updateValue(newValue));
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

    if (JSON.stringify(value) === JSON.stringify(this.value())) {
      return;
    }

    this.value.set(value);
  }

  /**
   * Handle conditions updates from the editor.
   */
  onConditionsChange(updatedConditions: any) {
    const conditionsForm = this.form.get("conditions");
    conditionsForm?.setValue(updatedConditions ?? {});
  }

  private updateEntityConstructor(entityType: string) {
    this.entityConstructor =
      entityType && this.entityRegistry.has(entityType)
        ? this.entityRegistry.get(entityType)
        : null;
  }
}
