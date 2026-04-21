import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { Logging } from "#src/app/core/logging/logging.service";
import { ConfigurableEnum } from "../../../basic-datatypes/configurable-enum/configurable-enum";
import { ConfigureEnumPopupComponent } from "../../../basic-datatypes/configurable-enum/configure-enum-popup/configure-enum-popup.component";
import {
  ConfigCleanupAnalysis,
  ConfigurableEnumCleanupService,
  ConfigurableEnumUsageSummary,
} from "./configurable-enum-cleanup.service";

@Component({
  selector: "app-configurable-enum-cleanup",
  templateUrl: "./configurable-enum-cleanup.component.html",
  styleUrl: "./configurable-enum-cleanup.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
})
export class ConfigurableEnumCleanupComponent implements OnInit {
  private readonly configCleanupService = inject(
    ConfigurableEnumCleanupService,
  );
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | undefined>(undefined);
  private readonly analysis = signal<ConfigCleanupAnalysis | undefined>(
    undefined,
  );
  private readonly deletingIds = signal<string[]>([]);

  protected readonly totalEnums = computed(
    () => this.analysis()?.totalEnums ?? 0,
  );
  protected readonly usedEnums = computed(
    () => this.analysis()?.usedEnums ?? 0,
  );
  protected readonly usedEnumDetails = computed(
    () => this.analysis()?.usedEnumDetails ?? [],
  );
  protected readonly unusedEnums = computed(
    () => this.analysis()?.unusedEnums ?? [],
  );

  ngOnInit(): void {
    void this.reload();
  }

  protected async reload() {
    this.isLoading.set(true);
    this.errorMessage.set(undefined);

    try {
      const analysis =
        await this.configCleanupService.analyzeUnusedConfigurableEnums();
      this.analysis.set(analysis);
    } catch (error) {
      Logging.error("Failed to analyze configurable enum cleanup data", error);
      this.errorMessage.set(
        $localize`Could not analyze configuration cleanup data. Please try again.`,
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected isDeleting(enumId: string) {
    return this.deletingIds().includes(enumId);
  }

  protected enumLabel(enumSummary: ConfigurableEnumUsageSummary): string {
    return this.formatEnumIdAsLabel(enumSummary.enumEntity.getId(true));
  }

  protected openEnumOptions(enumEntity: ConfigurableEnum, event: Event) {
    event.stopPropagation();
    this.dialog.open(ConfigureEnumPopupComponent, { data: enumEntity });
  }

  private formatEnumIdAsLabel(enumId: string): string {
    return enumId
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  protected async deleteEnum(unusedEnum: ConfigurableEnumUsageSummary) {
    const enumId = unusedEnum.enumEntity.getId(true);
    const enumLabel = this.enumLabel(unusedEnum);
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete unused enum?`,
      $localize`Are you sure you want to delete the unused enum "${enumLabel}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingIds.update((ids) => [...ids, enumId]);

    try {
      const deleted =
        await this.configCleanupService.deleteUnusedConfigurableEnum(
          unusedEnum.enumEntity,
        );

      if (deleted) {
        this.snackBar.open(
          $localize`Enum "${enumLabel}" deleted successfully.`,
          undefined,
          {
            duration: 3000,
          },
        );
        // Reload after delete to refresh the list
        await this.reload();
      } else {
        this.snackBar.open(
          $localize`Enum is now used in schema and cannot be deleted.`,
          undefined,
          {
            duration: 5000,
          },
        );
      }
    } catch (error) {
      Logging.error("Failed to delete configurable enum", error);
      this.snackBar.open(
        $localize`Could not delete enum. Please try again.`,
        undefined,
        {
          duration: 5000,
        },
      );
    } finally {
      this.deletingIds.update((ids) => ids.filter((id) => id !== enumId));
    }
  }
}
