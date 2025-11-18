import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { FieldGroup } from "app/core/entity-details/form/field-group";
import { FormConfig } from "app/core/entity-details/form/form.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { PublicFormConfig } from "../public-form-config";
import { migratePublicFormConfig } from "../public-form.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PublicFormsService } from "../public-forms.service";

@UntilDestroy()
@DynamicComponent("EditPublicFormColumns")
@Component({
  selector: "app-edit-public-form-columns",
  imports: [AdminEntityFormComponent, HintBoxComponent],
  templateUrl: "./edit-public-form-columns.component.html",
  styleUrl: "./edit-public-form-columns.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditPublicFormColumnsComponent,
    },
  ],
})
export class EditPublicFormColumnsComponent
  extends CustomFormControlDirective<FieldGroup[]>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Entity;

  @ViewChild(AdminEntityFormComponent) entityForm?: AdminEntityFormComponent;

  entityConstructor: EntityConstructor;
  formConfig: FormConfig;
  private originalFormConfig: FormConfig;

  // Signal to track disabled state for immediate UI updates
  isDisabled = signal(false);

  private entities = inject(EntityRegistry);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly publicFormsService = inject(PublicFormsService);

  get formControl(): FormControl<FieldGroup[]> {
    return this.ngControl.control as FormControl<FieldGroup[]>;
  }

  ngOnInit() {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity["entity"]);

      const publicFormConfig: PublicFormConfig = migratePublicFormConfig({
        columns: this.formControl.getRawValue(),
      } as Partial<PublicFormConfig> as PublicFormConfig);
      this.formConfig = {
        fieldGroups: publicFormConfig.columns,
      };
      this.originalFormConfig = JSON.parse(JSON.stringify(this.formConfig));
      this.setupFormStateDetection();
      // Set initial disabled state
      this.isDisabled.set(this.formControl.disabled);
      this.subscribeToPublicFormConfigSave();
    }
  }

  /**
   * Subscribe to entity save events to persist custom fields to global schema
   * after the PublicFormConfig is saved.
   */
  private subscribeToPublicFormConfigSave() {
    this.entityMapper
      .receiveUpdates(PublicFormConfig)
      .pipe(untilDestroyed(this))
      .subscribe(async (update) => {
        await this.publicFormsService.saveCustomFieldsToEntityConfig(
          update.entity,
        );
      });
  }

  updateValue(newConfig: FormConfig) {
    // setTimeout needed for change detection of disabling tabs
    setTimeout(() => this.formControl.setValue(newConfig.fieldGroups));
    this.formControl.markAsDirty();
  }

  /**
   * Setup form state detection for cancel vs save operations
   */
  private setupFormStateDetection(): void {
    let wasDirty = false;
    let lastValue: FieldGroup[] | null = null;

    // Listen to form control status and value changes to detect cancel operations
    this.formControl.statusChanges.subscribe(() => {
      const isDirty = this.formControl.dirty;
      const isPristine = this.formControl.pristine;
      const currentValue = this.formControl.value;

      // If form was dirty and now becomes pristine
      if (wasDirty && isPristine) {
        const normalizedCurrentValue = this.normalizeFieldGroups(
          currentValue || [],
        );
        const normalizedOriginalValue = this.normalizeFieldGroups(
          this.originalFormConfig.fieldGroups || [],
        );

        // Check if the value was reverted to original (cancel)
        const isValueRevertedToOriginal =
          JSON.stringify(normalizedCurrentValue) ===
          JSON.stringify(normalizedOriginalValue);

        if (isValueRevertedToOriginal) {
          // Reset UI to original configuration immediately
          this.formConfig = JSON.parse(JSON.stringify(this.originalFormConfig));
        }
      }
      wasDirty = isDirty;
      lastValue = currentValue;
      this.isDisabled.set(this.formControl.disabled);
    });
  }

  // Normalize both values for comparison (handle missing header property)
  private normalizeFieldGroups = (fieldGroups: FieldGroup[]) => {
    return fieldGroups.map((group) => ({
      ...group,
      header: group.header || null,
    }));
  };
}
