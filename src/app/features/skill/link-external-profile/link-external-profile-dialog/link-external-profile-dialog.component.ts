import { Component, inject, Inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import { ExternalProfile } from "../../external-profile";
import { MatProgressBar } from "@angular/material/progress-bar";
import { SkillApiService } from "../../skill-api.service";
import { firstValueFrom } from "rxjs";
import { Logging } from "../../../../core/logging/logging.service";
import { MatRadioButton, MatRadioGroup } from "@angular/material/radio";
import { FormsModule } from "@angular/forms";
import { MatTooltip } from "@angular/material/tooltip";
import { Entity } from "../../../../core/entity/model/entity";
import { ExternalProfileLinkConfig } from "../external-profile-link-config";

/**
 * The data passed to the MatDialog opening LinkExternalProfileDialogComponent.
 */
export interface LinkExternalProfileDialogData {
  /**
   * The entity object for which to search and select matching external profiles.
   */
  entity: Entity;

  /**
   * The configuration including details like search field mappings.
   */
  config: ExternalProfileLinkConfig;
}

@Component({
  selector: "app-link-external-profile-dialog",
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatDialogTitle,
    MatProgressBar,
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    MatTooltip,
  ],
  templateUrl: "./link-external-profile-dialog.component.html",
  styleUrl: "./link-external-profile-dialog.component.scss",
})
export class LinkExternalProfileDialogComponent implements OnInit {
  private skillApiService: SkillApiService = inject(SkillApiService);

  entity: Entity;
  config: ExternalProfileLinkConfig;

  loading: boolean = true;

  possibleMatches: (ExternalProfile & { _tooltip?: string })[];
  selected: ExternalProfile;
  error: { message?: string } & any;

  constructor(@Inject(MAT_DIALOG_DATA) data: LinkExternalProfileDialogData) {
    this.entity = data.entity;
    this.config = data.config;
  }

  async ngOnInit() {
    await this.searchMatches();
  }

  async searchMatches() {
    this.loading = true;
    this.error = undefined;
    this.selected = undefined;
    this.possibleMatches = [];

    const searchParams = this.getSearchParams();

    try {
      this.possibleMatches = (
        await firstValueFrom(
          this.skillApiService.getExternalProfiles(
            searchParams.name,
            searchParams.email,
            searchParams.phone,
          ),
        )
      ).map((profile) => ({
        ...profile,
        _tooltip: this.generateTooltip(profile),
      }));
    } catch (e) {
      Logging.warn("SkillModule: Failed to load external profiles", e);
      this.error = e;
      return;
    } finally {
      this.loading = false;
    }

    if (this.possibleMatches.length === 1) {
      this.selected = this.possibleMatches[0];
      // TODO: automatically return if exactly one result?
    }
    if (this.possibleMatches.length === 0) {
      this.error = {
        message: $localize`:external profile matching dialog:No matching external profiles found`,
      };
    }
  }

  private getSearchParams(): {
    name: string | undefined;
    email: string | undefined;
    phone: string | undefined;
  } {
    // TODO:

    return {
      name: this.config.searchFields.fullName
        .map((field) => this.entity[field])
        .filter((value) => !!value)
        .join(" "),
      email: this.config.searchFields.email
        .map((field) => this.entity[field])
        .filter((value) => !!value)
        .join(" "),
      phone: this.config.searchFields.phone
        .map((field) => this.entity[field])
        .filter((value) => !!value)
        .join(" "),
    };
  }

  private generateTooltip(profile: ExternalProfile) {
    return JSON.stringify(profile, null, 2);
  }
}
