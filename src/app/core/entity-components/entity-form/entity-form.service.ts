import { Injectable } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { EditPropertyConfig } from "../entity-details/form/FormConfig";
import { Entity } from "../../entity/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

@Injectable({
  providedIn: "root",
})
export class EntityFormService {
  constructor(
    private fb: FormBuilder,
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService
  ) {}

  public extendFormFieldConfig(
    formFields: EditPropertyConfig[],
    entity: Entity,
    forTable = false
  ) {
    formFields.forEach((formField) => {
      const propertySchema = entity.getSchema().get(formField.id);
      formField.input =
        formField.input ||
        this.entitySchemaService.getComponent(propertySchema, "edit");
      formField.view =
        formField.view ||
        this.entitySchemaService.getComponent(propertySchema, "view");
      formField.placeholder = formField.placeholder || propertySchema.label;
      if (forTable) {
        formField.forTable = true;
        formField.placeholder =
          propertySchema?.labelShort || formField.placeholder;
      }
    });
  }

  public createFormGroup(
    formFields: EditPropertyConfig[],
    entity: Entity
  ): FormGroup {
    const formConfig = {};
    formFields.forEach((formField) => {
      formConfig[formField.id] = [entity[formField.id]];
      if (formField.required) {
        formConfig[formField.id].push(Validators.required);
      }
    });
    return this.fb.group(formConfig);
  }

  public saveChanges(form: FormGroup, entity: Entity): Promise<Entity> {
    this.checkFormValidity(form);
    const entityConstructor = entity.getConstructor();
    entityConstructor.validateForm(form);

    this.assignFormValuesToEntity(form, entity);
    return this.entityMapper.save<Entity>(entity).catch((err) => {
      throw new Error(
        `Could not save ${entityConstructor.ENTITY_TYPE}: ${err}`
      );
    });
  }

  private checkFormValidity(form: FormGroup) {
    // errors regarding invalid fields wont be displayed unless marked as touched
    form.markAllAsTouched();
    if (form.invalid) {
      const invalidFields = this.getInvalidFields(form);
      throw new Error(`Fields: "${invalidFields}" are invalid`);
    }
  }

  private getInvalidFields(form: FormGroup): string {
    const invalid: string[] = [];
    const controls = form.controls;
    for (const field in controls) {
      if (controls[field].invalid) {
        invalid.push(field);
      }
    }
    return invalid.join(", ");
  }

  private assignFormValuesToEntity(form: FormGroup, entity: Entity) {
    Object.keys(form.controls).forEach((key) => {
      entity[key] = form.get(key).value;
    });
  }
}
