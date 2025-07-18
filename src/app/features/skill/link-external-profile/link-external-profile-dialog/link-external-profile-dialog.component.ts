import { Component, inject, OnInit } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatButton, MatIconButton } from "@angular/material/button";
import { ExternalProfile } from "../../skill-api/external-profile";
import { MatProgressBar } from "@angular/material/progress-bar";
import {
  ExternalProfileResponseDto,
  ExternalProfileSearchParams,
  SkillApiService,
} from "../../skill-api/skill-api.service";
import { firstValueFrom } from "rxjs";
import { Logging } from "../../../../core/logging/logging.service";
import { MatRadioButton, MatRadioGroup } from "@angular/material/radio";
import { FormsModule } from "@angular/forms";
import { MatTooltip } from "@angular/material/tooltip";
import { Entity } from "../../../../core/entity/model/entity";
import { ExternalProfileLinkConfig } from "../../external-profile-link-config";
import { MatFormField, MatSuffix } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

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

  /**
   * Optionally, pass a list of already identified possible matches
   * and skip the initial automatic search request.
   */
  possibleMatches?: ExternalProfile[];
}

@Component({
  selector: "app-link-external-profile-dialog",
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
    MatFormField,
    MatInput,
    MatIconButton,
    FaIconComponent,
    MatSuffix,
  ],
  templateUrl: "./link-external-profile-dialog.component.html",
  styleUrl: "./link-external-profile-dialog.component.scss",
})
export class LinkExternalProfileDialogComponent implements OnInit {
  private readonly skillApiService: SkillApiService = inject(SkillApiService);
  config: ExternalProfileLinkConfig;

  entity: Entity;
  searchParams: ExternalProfileSearchParams = {};

  loading: boolean;

  searchResult: ExternalProfileResponseDto;
  possibleMatches: (ExternalProfile & { _tooltip?: string })[];
  selected: ExternalProfile;
  error: { message?: string } & any;

  constructor() {
    const data = inject<LinkExternalProfileDialogData>(MAT_DIALOG_DATA);

    this.entity = data.entity;
    this.config = data.config;
    if (data.possibleMatches) {
      this.possibleMatches = data.possibleMatches.map(addTooltip);
    }
  }

  async ngOnInit() {
    this.searchParams = this.skillApiService.generateDefaultSearchParams(
      this.entity,
      this.config,
    );

    if (!this.possibleMatches) {
      await this.searchMatches();
    }
  }

  async searchMatches() {
    this.selected = undefined;
    this.possibleMatches = undefined;

    this.possibleMatches = await this.loadResults();
    if (!this.possibleMatches) {
      return;
    }

    if (this.possibleMatches.length === 1) {
      this.selected = this.possibleMatches[0];
    }
    if (this.possibleMatches.length === 0) {
      this.error = {
        message: $localize`:external profile matching dialog:No matching external profiles found`,
      };
    }
  }

  async loadResults(page?: number): Promise<ExternalProfile[]> {
    this.loading = true;
    this.error = undefined;

    try {
      this.searchResult = await firstValueFrom(
        this.skillApiService.getExternalProfiles(this.searchParams, page),
      );
    } catch (e) {
      Logging.warn("SkillModule: Failed to load external profiles", e);
      this.error = e;
      return;
    } finally {
      this.loading = false;
    }

    if (!this.searchResult?.results) {
      return;
    }

    return this.searchResult.results.map((profile) => addTooltip(profile));
  }

  async loadNextPage() {
    const newResults = await this.loadResults(
      this.searchResult.pagination.currentPage + 1,
    );
    this.possibleMatches = [...this.possibleMatches, ...newResults];
  }
}

function addTooltip(
  profile: ExternalProfile,
): ExternalProfile & { _tooltip?: string } {
  return { ...profile, _tooltip: JSON.stringify(profile, null, 2) };
}
