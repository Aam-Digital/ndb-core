import { Component, computed, inject, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import {
  ConditionEditorDialogComponent,
  ConditionEditorDialogData,
} from "#src/app/core/common-components/condition-editor-dialog/condition-editor-dialog.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { Entity } from "#src/app/core/entity/model/entity";
import { DataFilter } from "#src/app/core/filter/filters/filters";

/**
 * Form field to edit the condition that a record has to match to offer an external link.
 *
 * The fields offered in the condition are those of the record type selected in the same form.
 */
@DynamicComponent("EditExternalLinkCondition")
@Component({
  selector: "app-edit-external-link-condition",
  imports: [MatButtonModule, FaIconComponent],
  template: `
    <div class="flex-row align-center gap-regular">
      <span class="flex-grow">{{ summary() }}</span>
      <button
        mat-stroked-button
        type="button"
        [disabled]="!enabled()"
        (click)="editCondition()"
      >
        <fa-icon icon="filter" class="standard-icon-with-text"></fa-icon>
        @if (hasCondition()) {
          <ng-container i18n>Edit Condition</ng-container>
        } @else {
          <ng-container i18n>Add Condition</ng-container>
        }
      </button>
    </div>
  `,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditExternalLinkConditionComponent,
    },
  ],
})
export class EditExternalLinkConditionComponent
  extends CustomFormControlDirective<DataFilter<Entity> | undefined>
  implements EditComponent
{
  private readonly dialog = inject(MatDialog);
  private readonly entities = inject(EntityRegistry);

  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  protected readonly hasCondition = computed(
    () => Object.keys(this.valueSignal() ?? {}).length > 0,
  );

  protected readonly summary = computed(() =>
    this.hasCondition()
      ? $localize`Shown only for records matching the condition.`
      : $localize`Shown for all records of the type.`,
  );

  protected async editCondition() {
    // the record type as currently selected in the form, which may not be saved yet
    const entityType: string | undefined =
      this.formControl.parent?.get("entity")?.value;

    const result: DataFilter<Entity> | null | undefined = await firstValueFrom(
      this.dialog
        .open(ConditionEditorDialogComponent, {
          data: {
            entityConstructor:
              entityType && this.entities.has(entityType)
                ? this.entities.get(entityType)
                : undefined,
            conditions: this.formControl.value,
            explanation: $localize`This link is shown only for records matching...`,
          } satisfies ConditionEditorDialogData,
          width: "600px",
        })
        .afterClosed(),
      { defaultValue: undefined },
    );
    if (result === undefined) {
      // cancelled
      return;
    }

    this.formControl.setValue(result ?? undefined);
    this.formControl.markAsDirty();
  }
}
