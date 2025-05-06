import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatTooltip } from "@angular/material/tooltip";
import { EntityFieldLabelComponent } from "../../../common-components/entity-field-label/entity-field-label.component";
import { EntityConstructor } from "../../../entity/model/entity";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigInherited } from "../default-value-config-inherited";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EntityDatatype } from "../../../basic-datatypes/entity/entity.datatype";
import { EntityRegistry } from "../../../entity/database-entity.decorator";

@Component({
  selector: "app-admin-default-value-inherited",
  imports: [
    MatSelect,
    ReactiveFormsModule,
    MatTooltip,
    MatOption,
    EntityFieldLabelComponent,
  ],
  templateUrl: "./admin-default-value-inherited.component.html",
  styleUrl: "./admin-default-value-inherited.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminDefaultValueInheritedComponent,
    },
  ],
})
export class AdminDefaultValueInheritedComponent
  extends CustomFormControlDirective<DefaultValueConfigInherited>
  implements OnInit, OnChanges
{
  @Input() entityType: EntityConstructor;

  form: FormGroup;

  private entityRegistry = inject(EntityRegistry);
  @ViewChild("localAttributeSelect") localAttributeSelectElement: MatSelect;
  @ViewChild("fieldSelect") inheritedFieldSelectElement: MatSelect;

  availableInheritanceAttributes: string[];
  currentInheritanceFields: {
    localAttribute: string;
    referencedEntityType: EntityConstructor;
    availableFields: string[];
  };

  ngOnInit() {
    this.form = new FormGroup({
      localAttribute: new FormControl(this.value?.localAttribute, {
        validators: [Validators.required],
      }),
      field: new FormControl(this.value?.field, {
        validators: [Validators.required],
      }),
    });

    this.updateAvailableInheritanceAttributes();
    this.updateCurrentInheritanceFields(
      this.value?.localAttribute,
      this.value?.field,
    );

    this.form
      .get("localAttribute")
      .valueChanges.subscribe((v) => this.updateCurrentInheritanceFields(v));

    this.form.valueChanges.subscribe((v) => {
      if (this.form.invalid) {
        return;
      }
      this.value = v;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entityType) {
      this.updateAvailableInheritanceAttributes();
    }
  }

  private updateAvailableInheritanceAttributes() {
    this.availableInheritanceAttributes = Array.from(
      this.entityType.schema.entries(),
    )
      .filter(([_, schema]) => schema.dataType === EntityDatatype.dataType)
      .map(([id]) => id);

    setTimeout(() => this.localAttributeSelectElement?.open(), 200);
  }

  private updateCurrentInheritanceFields(
    localAttribute: string,
    setFieldValue?: string,
  ) {
    if (!localAttribute) {
      this.currentInheritanceFields = undefined;
      return;
    }

    const fieldSchema = this.entityType.schema.get(localAttribute);
    const referencedEntityType: EntityConstructor = !!fieldSchema
      ? this.entityRegistry.get(fieldSchema?.additional)
      : undefined;
    if (!referencedEntityType) {
      return;
    }

    const availableFields = Array.from(referencedEntityType.schema.entries())
      .filter(([_, schema]) => !!schema.label) // only "user-facing" fields (i.e. with label)
      .map(([id]) => id);

    this.currentInheritanceFields = {
      localAttribute,
      referencedEntityType,
      availableFields,
    };

    if (setFieldValue) {
      this.form.get("field").setValue(setFieldValue);
    } else {
      // reset and automatically open the field select dropdown
      this.form.get("field").setValue(null);
      setTimeout(() => this.inheritedFieldSelectElement?.open());
    }
  }
}
