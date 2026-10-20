import { EntityForm } from "../../../core/common-components/entity-form/entity-form";
import {
  Component,
  inject,
  ChangeDetectionStrategy,
  computed,
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

  /** changes whenever a value in the form changes, because form values are not signals */
  private readonly formValueChange = signal(0);

  /** also updates on its own when asynchronously loaded details used by the hint are ready */
  defaultValueHint = computed<DefaultValueHint | undefined>(() => {
    this.formValueChange();
    const form = this.form();
    const field = this.field();
    if (!form || !field) {
      return undefined;
    }

    return this.defaultValueService.getDefaultValueUiHint(form, field.id);
  });

  /** Whether this field's value is passed on to linked records, which can be updated through this button */
  canUpdateLinkedRecords = computed(() => {
    this.formValueChange();
    const form = this.form();
    const field = this.field();
    return (
      !!form?.entity &&
      !!field &&
      this.automatedFieldUpdateConfigService.hasLinkedRecordsToUpdate(
        form.entity,
        field.id,
      )
    );
  });

  /** Whether the linked records are being loaded or are being reviewed in the dialog */
  isUpdatingLinkedRecords = signal(false);

  constructor() {
    effect((onCleanup) => {
      const form = this.form();
      if (!form) {
        return;
      }

      const sub = form.formGroup.valueChanges
        .pipe(debounceTime(50))
        .subscribe(() => this.formValueChange.update((count) => count + 1));
      onCleanup(() => sub.unsubscribe());
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
