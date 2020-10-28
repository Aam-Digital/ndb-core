import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import {
  AbstractControlOptions,
  FormBuilder,
  Validators,
} from "@angular/forms";
import { Child } from "../../../model/child";
import { Gender } from "../../../model/Gender";
import { ChildPhotoService } from "../../../child-photo-service/child-photo.service";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../../../core/alerts/alert.service";
import { SessionService } from "../../../../../core/session/session-service/session.service";
import { FormSubcomponent } from "../form-subcomponent";

@Component({
  selector: "app-basic-info",
  templateUrl: "./basic-info.component.html",
  styleUrls: ["./basic-info.component.scss"],
})
export class BasicInfoComponent extends FormSubcomponent implements OnChanges {
  @Input() child: Child;

  documentStatus = [
    "OK (copy with us)",
    "OK (copy needed for us)",
    "needs correction",
    "applied",
    "doesn't have",
    "not eligible",
    "",
  ];

  creatingNew = false;
  isAdminUser: boolean;
  enablePhotoUpload = false;
  gender = Gender;

  genders = Gender;
  constructor(
    fb: FormBuilder,
    entityMapperService: EntityMapperService,
    alertService: AlertService,
    private childPhotoService: ChildPhotoService,
    private router: Router,
    private sessionService: SessionService
  ) {
    super(entityMapperService, fb, alertService);
    this.isAdminUser = this.sessionService.getCurrentUser().admin;
  }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes.hasOwnProperty("child") && !this.child.name) {
      // workaround to determine if a new child is being created, otherwise `name` has to be set
      this.creatingNew = true;
      this.switchEdit();
    }
  }

  switchEdit() {
    super.switchEdit();
    this.enablePhotoUpload = this.childPhotoService.canSetImage();
  }

  save(): Promise<any> {
    return super.save().then(() => {
      if (this.creatingNew) {
        this.router.navigate(["/child", this.child.getId()]);
      }
    });
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

  protected getFormConfig(): {
    controlsConfig: { [p: string]: any };
    options?: AbstractControlOptions | { [p: string]: any } | null;
  } {
    return {
      controlsConfig: {
        name: [
          { value: this.child.name, disabled: !this.editing },
          Validators.required,
        ],
        // gender: [{value: this.child.gender}], // reactive forms seem broken for mat-select on enum, using ngModel instead
        projectNumber: [
          { value: this.child.projectNumber, disabled: !this.editing },
        ],
        dateOfBirth: [
          { value: this.child.dateOfBirth, disabled: !this.editing },
        ],
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
        has_aadhar: [{ value: this.child.has_aadhar, disabled: !this.editing }],
        has_kanyashree: [
          { value: this.child.has_kanyashree, disabled: !this.editing },
        ],
        has_bankAccount: [
          { value: this.child.has_bankAccount, disabled: !this.editing },
        ],
        has_rationCard: [
          { value: this.child.has_rationCard, disabled: !this.editing },
        ],
        has_BplCard: [
          { value: this.child.has_BplCard, disabled: !this.editing },
        ],
      },
    };
  }
}
