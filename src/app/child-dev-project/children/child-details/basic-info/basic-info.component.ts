import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Child } from "../../model/child";
import { Gender } from "../../model/Gender";
import { ChildPhotoService } from "../../child-photo-service/child-photo.service";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../../core/alerts/alert.service";
import { SessionService } from "../../../../core/session/session-service/session.service";

@Component({
  selector: "app-basic-info",
  templateUrl: "./basic-info.component.html",
  styleUrls: ["./basic-info.component.scss"],
})
export class BasicInfoComponent implements OnChanges {
  @Input() child: Child = new Child("");

  form: FormGroup;
  editing: boolean = false;
  creatingNew = true;
  isAdminUser: boolean;
  validateForm = false;
  enablePhotoUpload;
  gender = Gender;

  genders = Gender;
  documentStatus = [
    "OK (copy with us)",
    "OK (copy needed for us)",
    "needs correction",
    "applied",
    "doesn't have",
    "not eligible",
    "",
  ];

  constructor(
    private fb: FormBuilder,
    private entityMapperService: EntityMapperService,
    private childPhotoService: ChildPhotoService,
    private router: Router,
    private alertService: AlertService,
    private sessionService: SessionService
  ) {
    this.isAdminUser = this.sessionService.getCurrentUser().admin;
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.creatingNew = false;
      this.initForm();
    }
  }

  switchEdit() {
    this.editing = !this.editing;
    this.enablePhotoUpload = this.childPhotoService.canSetImage();
    this.initForm();
  }

  save() {
    // errors regarding invalid fields wont be displayed unless marked as touched
    this.form.markAllAsTouched();
    this.validateForm = true;

    if (this.form.valid) {
      this.assignFormValuesToChild(this.child, this.form);

      this.entityMapperService
        .save<Child>(this.child)
        .then(() => {
          if (this.creatingNew) {
            this.router.navigate(["/child", this.child.getId()]);
            this.creatingNew = false;
          }
          this.alertService.addInfo("Saving Successful");
          this.switchEdit();
        })
        .catch((err) =>
          this.alertService.addDanger(
            'Could not save Child "' + this.child.name + '": ' + err
          )
        );
    } else {
      const invalidFields = this.getInvalidFields();
      this.alertService.addDanger(
        "Form invalid, required fields (" + invalidFields + ") missing"
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

  private assignFormValuesToChild(child: Child, form: FormGroup) {
    Object.keys(form.controls).forEach((key) => {
      const value = form.get(key).value;
      if (value !== null) {
        child[key] = value;
      }
    });
  }

  getInvalidFields() {
    const invalid = [];
    const controls = this.form.controls;
    for (const field in controls) {
      if (controls[field].invalid) {
        invalid.push(field);
      }
    }
    return invalid;
  }

  private initForm() {
    this.form = this.fb.group({
      name: [
        { value: this.child.name, disabled: !this.editing },
        Validators.required,
      ],
      // gender:         [{value: this.child.gender}], // reactive forms seem broken for mat-select, using ngModel instead
      projectNumber: [
        { value: this.child.projectNumber, disabled: !this.editing },
      ],
      dateOfBirth: [{ value: this.child.dateOfBirth, disabled: !this.editing }],
      motherTongue: [
        { value: this.child.motherTongue, disabled: !this.editing },
      ],
      religion: [{ value: this.child.religion, disabled: !this.editing }],

      center: [
        { value: this.child.center, disabled: !this.editing },
        Validators.required,
      ],
      status: [{ value: this.child.status, disabled: !this.editing }],
      admissionDate: [
        { value: this.child.admissionDate, disabled: !this.editing },
      ],
      address: [{ value: this.child.address, disabled: !this.editing }],
      phone: [{ value: this.child.phone, disabled: !this.editing }],
      guardianName: [
        { value: this.child.guardianName, disabled: !this.editing },
      ],
      preferredTimeForGuardianMeeting: [
        {
          value: this.child.preferredTimeForGuardianMeeting,
          disabled: !this.editing,
        },
      ],
      photoFile: [{ value: this.child.photoFile, disabled: !this.editing }],
    });
  }
}
