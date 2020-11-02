import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Child } from "../../model/child";
import {
  AbstractControlOptions,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
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
    if (!config.child.name) {
      this.creatingNew = true;
      this.switchEdit();
    }
  }

  switchEdit() {
    this.editing = !this.editing;
    this.initForm();
    console.log("before", this.enablePhotoUpload);
    this.enablePhotoUpload = this.childPhotoService.canSetImage();
    console.log("after", this.enablePhotoUpload);
  }

  async save(): Promise<any> {
    // errors regarding invalid fields wont be displayed unless marked as touched
    this.form.markAllAsTouched();
    this.validateForm = true;
    if (this.form.valid) {
      this.assignFormValuesToChild(this.child, this.form);
      try {
        await this.entityMapperService.save<Child>(this.child);
        if (this.creatingNew) {
          return this.router.navigate(["/child", this.child.getId()]);
        }
        this.alertService.addInfo("Saving Successful");
        this.switchEdit();
        return this.child;
      } catch (err) {
        this.alertService.addDanger(
          'Could not save Child "' + this.child.name + '": ' + err
        );
        throw new Error(err);
      }
    } else {
      const invalidFields = this.getInvalidFields();
      this.alertService.addDanger(
        "Form invalid, required fields (" + invalidFields + ") missing"
      );
      throw new Error(
        "Form invalid, required fields(" + invalidFields + ") missing"
      );
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

  protected buildFormConfig(): {
    controlsConfig: any;
    options?: AbstractControlOptions | { [p: string]: any } | null;
  } {
    // TODO save after first computation
    const formConfig = {};
    this.config.cols.flat().forEach((c) => {
      formConfig[c.id] = [{ value: this.child[c.id], disabled: !this.editing }];
      if (c.required) {
        formConfig[c.id].push(Validators.required);
      }
    });
    return { controlsConfig: formConfig };
  }

  private assignFormValuesToChild(child: Child, form: FormGroup) {
    Object.keys(form.controls).forEach((key) => {
      const value = form.get(key).value;
      if (value !== null) {
        child[key] = value;
      }
    });
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

  private initForm(): void {
    this.form = this.fb.group(this.buildFormConfig());
  }
}
