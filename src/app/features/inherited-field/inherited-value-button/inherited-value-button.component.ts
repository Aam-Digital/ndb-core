import { EntityForm } from "../../../core/common-components/entity-form/entity-form";
import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  input,
  signal,
} from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { TemplateTooltipDirective } from "../../../core/common-components/template-tooltip/template-tooltip.directive";
import {
  DefaultValueHint,
  DefaultValueService,
} from "../../../core/default-values/default-value-service/default-value.service";
import { EntityFieldLabelComponent } from "../../../core/entity/entity-field-label/entity-field-label.component";
import { Entity } from "../../../core/entity/model/entity";
import { debounceTime } from "rxjs/operators";
import { AlertService } from "../../../core/alerts/alert.service";
import { Logging } from "../../../core/logging/logging.service";
import { AutomatedFieldUpdateConfigService } from "../automated-field-update/automated-field-update-config.service";

/**
 * Display an indicator for form fields explaining the status of the inherited-value config of that field
 * and allowing users to re-sync the inherited value manually.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-inherited-value-button",
  imports: [
    EntityFieldLabelComponent,
    FaIconComponent,
    TemplateTooltipDirective,
    MatIconButton,
  ],
  templateUrl: "./inherited-value-button.component.html",
  styleUrl: "./inherited-value-button.component.scss",
})
export class InheritedValueButtonComponent {
  private readonly defaultValueService = inject(DefaultValueService);
  private readonly automatedFieldUpdateConfigService = inject(
    AutomatedFieldUpdateConfigService,
  );
  private readonly alertService = inject(AlertService);

  form = input<EntityForm<any>>();
  field = input<FormFieldConfig>();
  entity = input<Entity>();

  defaultValueHint = signal<DefaultValueHint | undefined>(undefined);

  /** Whether this field's value is passed on to linked records, which can be updated through this button */
  canUpdateLinkedRecords = signal(false);

  /** Whether the linked records are being loaded or are being reviewed in the dialog */
  isUpdatingLinkedRecords = signal(false);

  constructor() {
    effect((onCleanup) => {
      const form = this.form();
      const field = this.field();
      if (!form || !field) {
        this.defaultValueHint.set(undefined);
        return;
      }

      if (
        field.defaultValue?.mode == "inherited-field" &&
        !field.defaultValue?.config?.sourceReferenceField
      ) {
        this.defaultValueHint.set(undefined);
        return;
      }

      const updateHint = () => {
        this.defaultValueHint.set(
          this.defaultValueService.getDefaultValueUiHint(form, field.id),
        );
        this.canUpdateLinkedRecords.set(
          !!form.entity &&
            this.automatedFieldUpdateConfigService.hasLinkedRecordsToUpdate(
              form.entity,
              field.id,
            ),
        );
      };
      updateHint();

      let pendingTimeout: ReturnType<typeof setTimeout> | undefined;
      const sub = form.formGroup.valueChanges
        .pipe(debounceTime(50))
        .subscribe(() => {
          // ensure this is only called after the other changes handlers
          pendingTimeout = setTimeout(updateHint);
        });
      onCleanup(() => {
        sub.unsubscribe();
        if (pendingTimeout) {
          clearTimeout(pendingTimeout);
        }
      });
    });
  }

  async updateLinkedRecords() {
    this.isUpdatingLinkedRecords.set(true);
    try {
      const wereUpdated =
        await this.automatedFieldUpdateConfigService.updateLinkedRecords(
          this.form().entity,
          this.field().id,
        );
      if (!wereUpdated) {
        this.alertService.addInfo(
          $localize`The linked records are up to date.`,
        );
      }
    } catch (error) {
      Logging.error(
        "InheritedValueButton could not update the linked records",
        error,
      );
      this.alertService.addDanger(
        $localize`The linked records could not be updated.`,
      );
    } finally {
      this.isUpdatingLinkedRecords.set(false);
    }
  }
}
