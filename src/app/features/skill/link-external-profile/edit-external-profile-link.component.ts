import { Component, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import {
  LinkExternalProfileDialogComponent,
  LinkExternalProfileDialogData,
} from "./link-external-profile-dialog/link-external-profile-dialog.component";
import { ExternalProfile } from "../external-profile";
import { EditComponent } from "../../../core/entity/default-datatype/edit-component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { SkillApiService } from "../skill-api.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ExternalProfileLinkConfig } from "./external-profile-link-config";

@Component({
  selector: "app-edit-external-profile-link",
  standalone: true,
  imports: [
    MatButton,
    FaIconComponent,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./edit-external-profile-link.component.html",
  styleUrl: "./edit-external-profile-link.component.scss",
})
export class EditExternalProfileLinkComponent extends EditComponent<string> {
  /**
   * The configuration details for this external profile link,
   * defined in the config field's `additional` property.
   */
  declare additional: ExternalProfileLinkConfig;

  private dialog: MatDialog = inject(MatDialog);
  private skillApi: SkillApiService = inject(SkillApiService);

  externalProfile: ExternalProfile | undefined;

  async searchMatchingProfiles() {
    // TODO: should this only be enabled in "Edit" mode of form?

    // TODO: replace mock logic
    this.entity["externalProfileMockResults"] = this.parent.get(
      "externalProfileMockResults",
    )?.value;

    this.dialog
      .open(LinkExternalProfileDialogComponent, {
        data: {
          entity: this.entity,
          config: this.additional,
        } as LinkExternalProfileDialogData,
      })
      .afterClosed()
      .subscribe((result: ExternalProfile | undefined) => {
        if (result) {
          this.linkProfile(result);
        }
      });
  }

  private linkProfile(externalProfile: ExternalProfile) {
    this.externalProfile = externalProfile;
    this.formControl.setValue(externalProfile.id);
    this.formControl.markAsDirty();
  }

  unlinkExternalProfile() {
    this.externalProfile = undefined;
    this.formControl.setValue(null);
    this.formControl.markAsDirty();
  }

  async updateExternalData() {
    if (!this.formControl.value) {
      return;
    }

    const skills = await this.skillApi.getSkillsFromExternalProfile(
      this.formControl.value,
    );

    // TODO: run import / update
    const targetFormControl = this.parent.get("skills");
    targetFormControl?.setValue(skills);
    targetFormControl.markAsDirty();
    // TODO: this is not updated immediately, only shows after reopening the details view ... why?
  }
}
