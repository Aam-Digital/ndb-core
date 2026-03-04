import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { DownloadService } from "../../export/download-service/download.service";
import { Config } from "../../config/config";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";
import { ReportEntity } from "../../../features/reporting/report-config";
import { PublicFormConfig } from "../../../features/public-form/public-form-config";

/**
 * Admin page providing tools to help configure Aam Digital using AI agents.
 *
 * Allows admins to download all relevant configuration documents as a single
 * JSON file that can be shared with an AI assistant (e.g. ChatGPT, Claude)
 * to provide it with the necessary system context for configuration assistance.
 * No personal data is included — only structural configuration documents.
 */
@Component({
  selector: "app-admin-ai-agent",
  templateUrl: "./admin-ai-agent.component.html",
  styleUrls: ["./admin-ai-agent.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    FontAwesomeModule,
    ViewTitleComponent,
  ],
})
export class AdminAiAgentComponent {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly downloadService = inject(DownloadService);

  /**
   * Fetches all relevant config documents via EntityMapperService and downloads
   * them as a single JSON file suitable for use as AI agent context.
   */
  async downloadAiContext(): Promise<void> {
    const [configurableEnums, reportConfigs, publicFormConfigs] =
      await Promise.all([
        this.entityMapper.loadType(ConfigurableEnum),
        this.entityMapper.loadType(ReportEntity),
        this.entityMapper.loadType(PublicFormConfig),
      ]);

    const configDocs = await Promise.all([
      this.entityMapper.load(Config, Config.CONFIG_KEY).catch(() => null),
      this.entityMapper.load(Config, Config.PERMISSION_KEY).catch(() => null),
    ]);

    const docs = [
      ...configurableEnums,
      ...reportConfigs,
      ...publicFormConfigs,
      ...configDocs.filter(Boolean),
    ];

    await this.downloadService.triggerDownload(
      docs,
      "json",
      "aam-digital-ai-context",
    );
  }
}
