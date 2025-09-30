import {
  Component,
  inject,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  ViewChild,
  signal,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EditComponent } from "app/core/common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "app/core/entity/model/entity";

import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { FormConfig } from "app/core/entity-details/form/form.component";
import { FieldGroup } from "app/core/entity-details/form/field-group";
import { PublicFormConfig } from "../public-form-config";
import { migratePublicFormConfig } from "../public-form.component";

@DynamicComponent("EditPublicFormColumns")
@Component({
  selector: "app-edit-public-form-columns",
  imports: [AdminEntityFormComponent],
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

  // Signal to track disabled state for immediate UI updates
  isDisabled = signal(false);

  private entities = inject(EntityRegistry);

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
      const originalFormConfig = JSON.parse(JSON.stringify(this.formConfig));
      // TODO: Handle form reset/cancel events if needed
      // The original functionality to reset config on cancel may need to be reimplemented
      // when the AdminEntityFormComponent supports such events
      // if (this.entityForm) {
      //   this.entityForm.onFormStateChange.subscribe((event) => {
      //     if (event === "cancelled") {
      //       this.formConfig = originalFormConfig;
      //       this.formControl.setValue(originalFormConfig.fieldGroups);
      //     }
      //   });
      // }

      // Sync disabled state changes with signals for immediate UI updates
      this.formControl.statusChanges.subscribe(() => {
        this.isDisabled.set(this.formControl.disabled);
      });

      // Set initial disabled state
      this.isDisabled.set(this.formControl.disabled);
    }
  }

  updateValue(newConfig: FormConfig) {
    // setTimeout needed for change detection of disabling tabs
    setTimeout(() => this.formControl.setValue(newConfig.fieldGroups));
    this.formControl.markAsDirty();
  }
}
