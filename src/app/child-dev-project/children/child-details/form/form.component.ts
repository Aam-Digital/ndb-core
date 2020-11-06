import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Child } from "../../model/child";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../../core/alerts/alert.service";
import { ChildPhotoService } from "../../child-photo-service/child-photo.service";
import { Router } from "@angular/router";
import { SessionService } from "../../../../core/session/session-service/session.service";

@Component({
  selector: "app-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnChanges {
  @Input() child: Child;

  creatingNew = false;
  isAdminUser: boolean;
  enablePhotoUpload = false;

  editing: boolean = false;
  form: FormGroup;
  validateForm: boolean = false;
  config;

  constructor(
    private fb: FormBuilder,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private childPhotoService: ChildPhotoService,
    private router: Router,
    private sessionService: SessionService
  ) {
    this.isAdminUser = this.sessionService.getCurrentUser().admin;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.initForm();
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.child = config.child;
    this.config = config.config;
    this.initForm();
    if (config.isCreating) {
      this.creatingNew = true;
      this.switchEdit();
    }
  }

  switchEdit() {
    this.editing = !this.editing;
    this.initForm();
    this.enablePhotoUpload = this.childPhotoService.canSetImage();
  }

  async save(): Promise<Child> {
    this.checkFormValidity();
    this.assignFormValuesToChild(this.child, this.form);
    try {
      await this.entityMapperService.save<Child>(this.child);
      // if (this.creatingNew) {
      this.router.navigate(["/child", this.child.getId()]);
      // }
      this.alertService.addInfo("Saving Successful");
      this.switchEdit();
      return this.child;
    } catch (err) {
      this.alertService.addDanger(
        'Could not save Child "' + this.child.name + '": ' + err
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
      this.child.entityId
    );
    this.child.photo.next(await this.childPhotoService.getImage(this.child));
  }

  private buildFormConfig() {
    const formConfig = {};
    this.config.cols.forEach((c) =>
      c.forEach((r) => {
        formConfig[r.id] = [
          { value: this.child[r.id], disabled: !this.editing },
        ];
        if (r.required) {
          formConfig[r.id].push(Validators.required);
        }
      })
    );
    return formConfig;
  }

  private assignFormValuesToChild(child: Child, form: FormGroup) {
    Object.keys(form.controls).forEach((key) => {
      const value = form.get(key).value;
      if (value !== null) {
        child[key] = value;
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group(this.buildFormConfig());
  }

  private checkFormValidity() {
    // errors regarding invalid fields wont be displayed unless marked as touched
    this.form.markAllAsTouched();
    this.validateForm = true;
    if (!this.form.valid) {
      const invalidFields = this.getInvalidFields();
      this.alertService.addDanger(
        "Form invalid, required fields (" + invalidFields + ") missing"
      );
      throw new Error(
        "Form invalid, required fields(" + invalidFields + ") missing"
      );
    }
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
