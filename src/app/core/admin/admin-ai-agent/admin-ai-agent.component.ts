import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { DownloadService } from "../../export/download-service/download.service";
import { Database } from "../../database/database";

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
  imports: [
    MatButtonModule,
    MatCardModule,
    FontAwesomeModule,
    ViewTitleComponent,
  ],
})
export class AdminAiAgentComponent {
  private db: Database = inject(DatabaseResolverService).getDatabase();
  private downloadService = inject(DownloadService);

  /** DB ID prefixes for all config-related document types to include in the AI context export. */
  static readonly AI_CONTEXT_PREFIXES = [
    "Config:",
    "ConfigurableEnum:",
    "ReportConfig:",
    "PublicFormConfig:",
  ];

  /**
   * Fetches all relevant config documents from the database and downloads
   * them as a single JSON file suitable for use as AI agent context.
   */
  async downloadAiContext(): Promise<void> {
    const docArrays = await Promise.all(
      AdminAiAgentComponent.AI_CONTEXT_PREFIXES.map((prefix) =>
        this.db.getAll(prefix),
      ),
    );

    const docs = docArrays.flat().map(({ _rev: _, ...doc }) => doc);

    await this.downloadService.triggerDownload(
      JSON.stringify(docs, null, 2),
      "json",
      "aam-digital-ai-context",
    );
  }
}
