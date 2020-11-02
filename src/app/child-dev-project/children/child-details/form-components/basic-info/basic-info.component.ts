import { Component, Input, OnChanges } from "@angular/core";
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

  onInitFromDynamicConfig(config: any) {
    super.onInitFromDynamicConfig(config);
    if (!config.child.name) {
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
        return this.router.navigate(["/child", this.child.getId()]);
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
    controlsConfig: any;
    options?: AbstractControlOptions | { [p: string]: any } | null;
  } {
    // TODO save after first computation
    const formConfig = {};
    this.config.cols.flat().forEach((c) => {
      formConfig[c.id] = [{ value: this.child[c.id], disabled: !this.editing }];
      if (c.required) {
        formConfig[c.id].required = Validators.required;
      }
    });
    return { controlsConfig: formConfig };
  }
}
