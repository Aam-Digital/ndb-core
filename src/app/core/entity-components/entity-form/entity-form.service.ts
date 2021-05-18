import { Injectable } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FormFieldConfig } from "../entity-details/form/FormConfig";
import { Entity } from "../../entity/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { AlertService } from "../../alerts/alert.service";

@Injectable({
  providedIn: "root",
})
export class EntityFormService {
  constructor(
    private fb: FormBuilder,
    private entityMapper: EntityMapperService,
    private alertService: AlertService
  ) {}

  public createFormGroup(formFields: FormFieldConfig[], entity: Entity): any {
    const formConfig = {};
    formFields.forEach((formField) => {
      formConfig[formField.id] = [entity[formField.id]];
      if (formField.required) {
        formConfig[formField.id].push(Validators.required);
      }
    });
    return this.fb.group(formConfig);
  }

  public async saveChanges(form: FormGroup, entity: Entity): Promise<Entity> {
    if (this.isInvalid(form)) {
      throw new Error("Form invalid");
    }

    this.assignFormValuesToEntity(form, entity);
    try {
      await this.entityMapper.save<Entity>(entity);
      this.alertService.addInfo("Saving Successful");
      return entity;
    } catch (err) {
      this.alertService.addDanger(
        'Could not save "' + entity.getConstructor().ENTITY_TYPE + '": ' + err
      );
      throw new Error(err);
    }
  }

  private isInvalid(form: FormGroup): boolean {
    // errors regarding invalid fields wont be displayed unless marked as touched
    form.markAllAsTouched();
    if (form.invalid) {
      const invalidFields = this.getInvalidFields(form);
      this.alertService.addDanger(
        "Form invalid, required fields (" + invalidFields + ") missing"
      );
      return true;
    }

    return false;
  }

  private getInvalidFields(form: FormGroup) {
    const invalid = [];
    const controls = form.controls;
    for (const field in controls) {
      if (controls[field].invalid) {
        invalid.push(field);
      }
    }
    return invalid;
  }

  private assignFormValuesToEntity(form: FormGroup, entity: Entity) {
    Object.keys(form.controls).forEach((key) => {
      entity[key] = form.get(key).value;
    });
    console.log("entity", entity);
  }
}
