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
import { firstValueFrom } from "rxjs";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

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
  private dialog: MatDialog = inject(MatDialog);
  private skillApi: SkillApiService = inject(SkillApiService);

  externalProfile: ExternalProfile | undefined;

  async searchMatchingProfiles() {
    // TODO: should this only be enabled in "Edit" mode of form?

    this.dialog
      .open(LinkExternalProfileDialogComponent, {
        data: { entity: this.entity } as LinkExternalProfileDialogData,
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

    this.externalProfile = await firstValueFrom(
      this.skillApi.getExternalProfileById(this.formControl.value),
    );

    // TODO: run import / update
    this.parent
      .get("skills")
      .setValue(JSON.stringify(this.externalProfile.skills));
  }
}
