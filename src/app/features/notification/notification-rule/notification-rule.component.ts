import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  model,
  output,
  signal,
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
  entityConstructor = signal<EntityConstructor | null>(null);

  private readonly entityRegistry = inject(EntityRegistry);

  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) {
        return;
      }

      if (!this.form) {
        this.initForm(value);
        return;
      }

      this.form.patchValue(value, { emitEvent: false });
      this.updateEntityConstructor(this.entityTypeControl.value);
      this.setEntityTypeControlState(this.form.get("conditions")?.value);
    });
  }

  initForm(value: NotificationRule) {
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

    this.setEntityTypeControlState(conditionsControl.value);
    conditionsControl.valueChanges.subscribe((v) =>
      this.setEntityTypeControlState(v),
    );
  }

  private setEntityTypeControlState(conditions: unknown) {
    const hasConditions =
      typeof conditions === "object" &&
      conditions !== null &&
      Object.keys(conditions).length > 0;
    if (hasConditions) {
      this.entityTypeControl.disable({ emitEvent: false });
    } else {
      this.entityTypeControl.enable({ emitEvent: false });
    }
  }

  private updateValue(value: NotificationRule) {
    const entityTypeControl = this.form.get("entityType");
    const nextValue = {
      ...value,
      entityType: entityTypeControl?.disabled
        ? entityTypeControl.value
        : value.entityType,
    };

    if (JSON.stringify(nextValue) === JSON.stringify(this.value())) {
      return;
    }

    this.value.set(nextValue);
  }

  /**
   * Handle conditions updates from the editor.
   */
  onConditionsChange(updatedConditions: any) {
    const conditionsForm = this.form.get("conditions");
    conditionsForm?.setValue(updatedConditions ?? {});
  }

  private updateEntityConstructor(entityType: string) {
    this.entityConstructor.set(
      entityType && this.entityRegistry.has(entityType)
        ? this.entityRegistry.get(entityType)
        : null,
    );
  }
}
