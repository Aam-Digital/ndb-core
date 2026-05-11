import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { EntityConstructor } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-fields-menu",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    EntityFieldSelectComponent,
  ],
  templateUrl: "./entity-fields-menu.component.html",
  styleUrl: "./entity-fields-menu.component.scss",
})
export class EntityFieldsMenuComponent implements OnInit {
  private entityFormService = inject(EntityFormService, { optional: true });

  entityType = input<EntityConstructor>();
  availableFields = input<ColumnConfig[]>([]);
  activeFields = input<ColumnConfig[]>([]);
  activeFieldsChange = output<ColumnConfig[]>();
  selectedFieldsControl = new FormControl<string[]>([]);

  readonly _availableFields = computed<FormFieldConfig[]>(() => {
    const entityType = this.entityType();
    const fieldsConfig: FormFieldConfig[] = this.availableFields()
      .map((field) => {
        const mappedField =
          this.entityFormService && entityType
            ? this.entityFormService.extendFormFieldConfig(field, entityType)
            : toFormFieldConfig(field);

        if (typeof field === "object") {
          mappedField["_customField"] = true;
        }

        return mappedField;
      })
      .filter((field) => !field.isInternalField && field.label);

    const deduplicatedFieldsById: Record<string, FormFieldConfig> = {};
    for (const field of fieldsConfig) {
      if (!deduplicatedFieldsById[field.id]) {
        deduplicatedFieldsById[field.id] = field;
      }
    }
    return Object.values(deduplicatedFieldsById);
  });

  constructor() {
    effect(() => {
      const selectedFields = this.activeFields()?.map((field) =>
        typeof field === "string" ? field : field.id,
      );
      this.selectedFieldsControl.setValue(selectedFields, {
        emitEvent: false,
      });
    });
  }

  ngOnInit() {
    this.selectedFieldsControl.valueChanges.subscribe((value: string[]) => {
      const mappedFields: ColumnConfig[] = value.map((v) => {
        const availableField = this._availableFields().find((f) => f.id === v);

        if (availableField?.["_customField"]) {
          const result = { ...availableField };
          delete result["_customField"];
          return result;
        } else return v;
      });

      this.activeFieldsChange.emit(mappedFields);
    });
  }
}
