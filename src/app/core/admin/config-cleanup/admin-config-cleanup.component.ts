import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import {
  ConfigCleanupAnalysis,
  ConfigCleanupService,
  UnusedConfigurableEnum,
} from "./config-cleanup.service";

@Component({
  selector: "app-admin-config-cleanup",
  templateUrl: "./admin-config-cleanup.component.html",
  styleUrl: "./admin-config-cleanup.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatListModule, MatProgressSpinnerModule],
})
export class AdminConfigCleanupComponent {
  private readonly configCleanupService = inject(ConfigCleanupService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | undefined>(undefined);
  private readonly analysis = signal<ConfigCleanupAnalysis | undefined>(
    undefined,
  );
  private readonly deletingIds = signal<string[]>([]);

  protected readonly totalEnums = computed(
    () => this.analysis()?.totalEnums ?? 0,
  );
  protected readonly usedEnums = computed(() => this.analysis()?.usedEnums ?? 0);
  protected readonly unusedEnums = computed(
    () => this.analysis()?.unusedEnums ?? [],
  );

  constructor() {
    void this.reload();
  }

  protected async reload() {
    this.isLoading.set(true);
    this.errorMessage.set(undefined);

    try {
      const analysis = await this.configCleanupService.analyzeUnusedConfigurableEnums();
      this.analysis.set(analysis);
    } catch {
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

  protected async deleteEnum(unusedEnum: UnusedConfigurableEnum) {
    const enumId = unusedEnum.enumEntity.getId(true);
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete unused enum?`,
      $localize`Are you sure you want to delete the unused enum "${enumId}"?`,
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
        this.snackBar.open($localize`Enum deleted`, undefined, {
          duration: 3000,
        });
      } else {
        this.snackBar.open(
          $localize`Enum is now used in schema and cannot be deleted.`,
          undefined,
          {
            duration: 5000,
          },
        );
      }

      await this.reload();
    } finally {
      this.deletingIds.update((ids) => ids.filter((id) => id !== enumId));
    }
  }
}