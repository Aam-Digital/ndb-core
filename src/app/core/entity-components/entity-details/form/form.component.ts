import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { FormConfig, FormFieldConfig } from "./FormConfig";
import { PanelConfig } from "../EntityDetailsConfig";
import { Entity } from "../../../entity/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { SessionService } from "../../../session/session-service/session.service";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { AlertService } from "../../../alerts/alert.service";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { calculateAge, getParentUrl } from "../../../../utils/utils";
import { Child } from "../../../../child-dev-project/children/model/child";
import { OperationType } from "../../../permissions/entity-permissions.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { Photo } from "../../../../child-dev-project/children/child-photo-service/photo";
import { BehaviorSubject } from "rxjs";

/**
 * This component creates a form based on the passed config.
 * It creates a flexible layout and includes validation functionality.
 */
@Component({
  selector: "app-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnInitDynamicComponent, OnInit {
  entity: Entity;

  operationType = OperationType;

  creatingNew = false;
  isAdminUser: boolean;
  enablePhotoUpload = false;

  editing: boolean = false;
  config: FormConfig;

  columns: FormFieldConfig[][];
  validateForm: boolean = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private childPhotoService: ChildPhotoService,
    private router: Router,
    private sessionService: SessionService,
    private entitySchemaService: EntitySchemaService
  ) {
    this.isAdminUser = this.sessionService.getCurrentUser().admin;
  }

  ngOnInit() {
    this.initForm();
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.config = config.config;
    this.initForm();
    if (config.creatingNew) {
      this.creatingNew = true;
      this.switchEdit();
    }
  }

  switchEdit() {
    this.editing = !this.editing;
    this.initForm();
    this.enablePhotoUpload = this.childPhotoService.canSetImage();
  }

  calculateAge(selectedDateOfBirth: string) {
    return selectedDateOfBirth
      ? calculateAge(new Date(selectedDateOfBirth))
      : "";
  }

  async save(): Promise<Entity> {
    if (!this.checkFormValidity()) {
      return;
    }

    this.assignFormValuesToEntity();
    try {
      await this.entityMapperService.save<Entity>(this.entity);
      this.router.navigate([getParentUrl(this.router), this.entity.getId()]);
      this.alertService.addInfo("Saving Successful");
      this.switchEdit();
      return this.entity;
    } catch (err) {
      this.alertService.addDanger(
        'Could not save "' +
          this.entity.getConstructor().ENTITY_TYPE +
          '": ' +
          err
      );
      throw new Error(err);
    }
  }

  /**
   * hands over the selected file to the cloudFileService together with the childId
   * @param event The event of the file upload dialog
   */
  async uploadChildPhoto(event) {
    await this.childPhotoService.setImage(
      event.target.files[0],
      this.entity.entityId
    );
    // Photo does so far only work on the child entity
    const child: Child = this.entity as Child;
    child.photo.photo.next(await this.childPhotoService.getImage(child));
  }

  changeFilename(path: string, fromGroupID: string) {
    const newValue: Photo = {
      path: path,
      photo: new BehaviorSubject(ChildPhotoService.getImageFromAssets(path)),
    };
    this.form.get(fromGroupID).setValue(newValue);
  }

  private initForm(): void {
    this.columns = this.config.cols.map((column) =>
      column.map((row) => {
        if (!row.input) {
          row.input = this.entitySchemaService.getComponent(
            this.entity.getSchema().get(row.id),
            "edit"
          );
        }
        return row;
      })
    );
    this.form = this.fb.group(this.buildFormConfig());
  }

  private buildFormConfig() {
    const formConfig = {};
    this.config.cols.forEach((c) =>
      c.forEach((r) => {
        formConfig[r.id] = [
          { value: this.entity[r.id], disabled: !this.editing },
        ];
        if (r.required) {
          formConfig[r.id].push(Validators.required);
        }
      })
    );
    return formConfig;
  }

  private assignFormValuesToEntity() {
    Object.keys(this.form.controls).forEach((key) => {
      const value = this.form.get(key).value;
      if (value !== null) {
        this.entity[key] = value;
      }
    });
    console.log("entity", this.entity);
  }

  private checkFormValidity(): boolean {
    // errors regarding invalid fields wont be displayed unless marked as touched
    this.form.markAllAsTouched();
    this.validateForm = true;
    if (!this.form.valid) {
      const invalidFields = this.getInvalidFields();
      this.alertService.addDanger(
        "Form invalid, required fields (" + invalidFields + ") missing"
      );
      return false;
    }

    return true;
  }

  private getInvalidFields() {
    const invalid = [];
    const controls = this.form.controls;
    for (const field in controls) {
      if (controls[field].invalid) {
        invalid.push(field);
      }
    }
    return invalid;
  }
}
