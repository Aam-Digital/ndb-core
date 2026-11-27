import {
  computed,
  Component,
  effect,
  inject,
  ChangeDetectionStrategy,
  input,
  viewChild,
} from "@angular/core";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { BackgroundProcessState } from "../background-process-state.interface";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDividerModule } from "@angular/material/divider";
import { DatabaseResolverService } from "../../../database/database-resolver.service";
import { SessionType } from "../../../session/session-type";
import { environment } from "../../../../../environments/environment";
import { Logging } from "../../../logging/logging.service";

/**
 * A dumb component handling presentation of the sync indicator icon
 * and an additional details dropdown listing all currently running background processes.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-background-processing-indicator",
  templateUrl: "./background-processing-indicator.component.html",
  styleUrls: ["./background-processing-indicator.component.scss"],
  imports: [
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatDividerModule,
  ],
})
export class BackgroundProcessingIndicatorComponent {
  /** details on current background processes to be displayed to user */
  backgroundProcesses = input.required<BackgroundProcessState[]>();

  /** whether processes of with the same title shall be summarized into one line */
  summarize = input(true);

  private readonly dbResolver = inject(DatabaseResolverService);

  filteredProcesses = computed(() =>
    this.summarizeProcesses(this.backgroundProcesses()),
  );

  /** whether to show the manual sync button (hide in pure online-only mode) */
  showManualSync = computed(
    () => environment.session_type !== SessionType.online,
  );
  taskCounter = computed(
    () => this.filteredProcesses().filter((process) => process.pending).length,
  );
  allTasksFinished = computed(() => this.taskCounter() === 0);

  /** handle to programmatically close the details dropdown */
  taskListDropdownTrigger = viewChild(MatMenuTrigger);

  /**
   * Close the details once all processes finished.
   * The details are never opened automatically (that would grab focus on every regular sync),
   * users open them by clicking the sync icon.
   */
  private readonly closeWhenFinishedEffect = effect(() => {
    if (this.allTasksFinished()) {
      this.taskListDropdownTrigger()?.closeMenu();
    }
  });

  /**
   * Clear sync checkpoints and trigger a full re-sync.
   */
  async resetSync(): Promise<void> {
    try {
      await this.dbResolver.resetSync();
    } catch (err) {
      // already reported by the database according to its cause; called from a
      // click handler, so a rethrow would only report it again as an unhandled error
      Logging.debug("Manually triggered re-sync failed", err);
    }
  }

  closeTaskListDropdown(): void {
    this.taskListDropdownTrigger()?.closeMenu();
  }

  private combineProcesses(
    first: BackgroundProcessState,
    second: BackgroundProcessState,
  ): BackgroundProcessState {
    return {
      title: first.title,
      pending: first.pending || second.pending,
    };
  }

  private summarizeProcesses(
    processes: BackgroundProcessState[],
  ): BackgroundProcessState[] {
    if (!this.summarize()) {
      return processes;
    }
    const accumulator: BackgroundProcessState[] = [];
    for (const process of processes) {
      const summaryEntry = accumulator.findIndex(
        (i) => i.title === process.title,
      );
      if (summaryEntry === -1) {
        accumulator.push(process);
      } else {
        accumulator[summaryEntry] = this.combineProcesses(
          accumulator[summaryEntry],
          process,
        );
      }
    }
    return accumulator;
  }
}
