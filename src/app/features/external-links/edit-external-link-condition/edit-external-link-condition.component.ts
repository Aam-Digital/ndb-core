import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { firstValueFrom } from "rxjs";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
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
  imports: [MatButtonModule, FaDynamicIconComponent],
  template: `
    <div class="flex-row align-center gap-regular">
      <span class="flex-grow">{{ summary() }}</span>
      <button
        mat-stroked-button
        type="button"
        [disabled]="!enabled() || !recordType()"
        (click)="editCondition()"
      >
        <app-fa-dynamic-icon
          icon="filter"
          class="standard-icon-with-text"
        ></app-fa-dynamic-icon>
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
  implements EditComponent, OnInit
{
  private readonly dialog = inject(MatDialog);
  private readonly entities = inject(EntityRegistry);
  private readonly destroyRef = inject(DestroyRef);

  /** the record type as currently selected in the same form, which may not be saved yet */
  protected readonly recordType = signal<string | undefined>(undefined);

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

  ngOnInit() {
    const recordTypeControl = this.formControl?.parent?.get("entity");
    if (!recordTypeControl) return;

    this.recordType.set(recordTypeControl.value);
    recordTypeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((recordType: string | undefined) => {
        // a condition refers to fields of the previous record type
        if (recordType !== this.recordType() && this.hasCondition()) {
          this.formControl.setValue(undefined);
          this.formControl.markAsDirty();
        }
        this.recordType.set(recordType);
      });
  }

  protected async editCondition() {
    const entityType = this.recordType();

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
