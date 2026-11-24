import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatSnackBar } from "@angular/material/snack-bar";
import moment from "moment";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { DownloadService } from "../../export/download-service/download.service";
import { Config } from "../../config/config";
import { ConfigService } from "../../config/config.service";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";
import { ReportEntity } from "#src/app/features/reporting/report-config";
import { PublicFormConfig } from "#src/app/features/public-form/public-form-config";
import { SiteSettings } from "../../site-settings/site-settings";
import { JsonEditorService } from "../json-editor/json-editor.service";
import { Logging } from "#src/app/core/logging/logging.service";
import { readFile } from "../../../utils/utils";

/**
 * Admin page to edit the application configuration, either manually or supported by AI agents.
 *
 * Manual changes: edit the raw configuration in a JSON editor, or download it, change it
 * and upload it again.
 *
 * AI-supported changes: download all relevant configuration documents as a single
 * JSON file that can be shared with an AI assistant (e.g. ChatGPT, Claude)
 * to provide it with the necessary system context for configuration assistance.
 * The result can then be applied through the config upload.
 * No personal data is included — only structural configuration documents.
 */
@Component({
  selector: "app-admin-ai-agent",
  templateUrl: "./admin-ai-agent.component.html",
  styleUrls: ["./admin-ai-agent.component.scss"],
  imports: [
    MatButtonModule,
    MatCardModule,
    FaDynamicIconComponent,
    ViewTitleComponent,
  ],
})
export class AdminAiAgentComponent {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly downloadService = inject(DownloadService);
  private readonly configService = inject(ConfigService);
  private readonly jsonEditorService = inject(JsonEditorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  isUploadingConfig = signal(false);

  /**
   * Fetches all relevant config documents via EntityMapperService and downloads
   * them as a single JSON file suitable for use as AI agent context.
   */
  async downloadAiContext(): Promise<void> {
    const documentSources = [
      this.entityMapper
        .load(Config, Config.CONFIG_KEY)
        .then((document) => [document])
        .catch(() => []),
      this.entityMapper
        .load(Config, Config.PERMISSION_KEY)
        .then((document) => [document])
        .catch(() => []),
      this.entityMapper.loadType(ConfigurableEnum),
      this.entityMapper.loadType(SiteSettings),
      this.entityMapper.loadType(ReportEntity),
      this.entityMapper.loadType(PublicFormConfig),
    ];

    const docs = (await Promise.all(documentSources)).flat();

    await this.downloadService.triggerDownload(
      docs,
      "json",
      "aam-digital-ai-context_" +
        location.hostname +
        "_" +
        moment().format() +
        ".json",
    );
  }

  async downloadConfigClick() {
    const configString = this.configService.exportConfig();
    await this.downloadService.triggerDownload(configString, "json", "config");
  }

  async uploadConfigFile(inputEvent: Event) {
    this.isUploadingConfig.set(true);
    try {
      const loadedFile = await readFile(this.getFileFromInputEvent(inputEvent));
      const parsed = JSON.parse(loadedFile);
      if (Array.isArray(parsed)) {
        const entities = parsed
          .map((doc) => {
            try {
              return this.entityMapper.entityFromRawDoc(doc);
            } catch (e) {
              Logging.warn(
                "Skipping unknown entity type during config upload",
                doc["_id"],
                e,
              );
              return null;
            }
          })
          .filter(Boolean);
        await this.entityMapper.saveAll(entities, true);
      } else {
        await this.configService.saveConfig(parsed);
      }
      this.snackBar.open($localize`Configuration updated`, undefined, {
        duration: 3000,
      });
    } catch (e) {
      Logging.error("Failed to upload configuration", e);
      this.snackBar.open($localize`Upload failed: ${e.message}`, undefined, {
        duration: 5000,
      });
    } finally {
      this.isUploadingConfig.set(false);
    }
  }

  editConfig() {
    const originalData = this.configService.exportConfig(true);
    this.jsonEditorService
      .openJsonEditorDialog(originalData)
      .subscribe(async (updatedData) => {
        if (!updatedData) return;

        const previousConfigBackup = new Config(
          Config.CONFIG_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
          originalData,
        );
        try {
          await this.entityMapper.save(previousConfigBackup);
          await this.configService.saveConfig(updatedData);

          this.showConfirmationWithUndoOption(async () => {
            await this.configService.saveConfig(originalData);
            await this.entityMapper.remove(previousConfigBackup);
          });
        } catch (e) {
          Logging.error("Failed to save configuration changes", e);
          this.snackBar.open(
            $localize`Update failed: ${e.message}`,
            undefined,
            {
              duration: 5000,
            },
          );
        }
      });
  }

  /**
   * Show a snack bar with undo option and handle undo callback with progress dialog.
   */
  private showConfirmationWithUndoOption(undoAction: () => Promise<void>) {
    const snackBarRef = this.snackBar.open(
      $localize`Configuration updated`,
      $localize`Undo`,
      { duration: 8000 },
    );

    snackBarRef.onAction().subscribe(async () => {
      const progressRef = this.confirmationDialog.showProgressDialog(
        signal($localize`Reverting configuration changes ...`),
      );
      try {
        await undoAction();
      } catch (e) {
        Logging.error("Failed to revert configuration changes", e);
        this.snackBar.open($localize`Revert failed: ${e.message}`, undefined, {
          duration: 5000,
        });
      } finally {
        progressRef.close();
      }
    });
  }

  private getFileFromInputEvent(inputEvent: Event): Blob {
    const target = inputEvent.target as HTMLInputElement;
    return target.files[0];
  }
}
