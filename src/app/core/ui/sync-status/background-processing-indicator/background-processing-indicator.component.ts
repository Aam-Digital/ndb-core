import {
  computed,
  Component,
  effect,
  inject,
  ChangeDetectionStrategy,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { BackgroundProcessState } from "../background-process-state.interface";
import { Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDividerModule } from "@angular/material/divider";
import { DatabaseResolverService } from "../../../database/database-resolver.service";
import { SessionType } from "../../../session/session-type";
import { environment } from "../../../../../environments/environment";

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
  backgroundProcesses = input.required<Observable<BackgroundProcessState[]>>();

  /** whether processes of with the same title shall be summarized into one line */
  summarize = input(true);
  wasClosed = signal(false);

  private readonly dbResolver = inject(DatabaseResolverService);
  private readonly currentProcesses = toSignal(
    toObservable(this.backgroundProcesses).pipe(
      switchMap((processes) => processes),
    ),
    { initialValue: [] as BackgroundProcessState[] },
  );

  filteredProcesses = computed(() =>
    this.summarizeProcesses(this.currentProcesses()),
  );

  /** whether to show the manual sync button (hide in pure online-only mode) */
  showManualSync = computed(
    () => environment.session_type !== SessionType.online,
  );
  taskCounter = computed(
    () => this.filteredProcesses().filter((process) => process.pending).length,
  );
  allTasksFinished = computed(() => this.taskCounter() === 0);

  /** handle to programmatically open/close the details dropdown */
  taskListDropdownTrigger = viewChild(MatMenuTrigger);
  private openMenuTimeout: ReturnType<typeof setTimeout> | undefined;

  private readonly taskCounterEffect = effect((onCleanup) => {
    const amount = this.taskCounter();
    const taskListDropdownTrigger = this.taskListDropdownTrigger();

    if (amount === 0) {
      if (this.openMenuTimeout) {
        clearTimeout(this.openMenuTimeout);
      }
      taskListDropdownTrigger?.closeMenu();
      this.wasClosed.set(false);
    } else {
      if (!this.wasClosed()) {
        // Need to wait for the change cycle that shows the sync button.
        if (this.openMenuTimeout) {
          clearTimeout(this.openMenuTimeout);
        }
        this.openMenuTimeout = setTimeout(() =>
          taskListDropdownTrigger?.openMenu(),
        );
      }
    }

    onCleanup(() => {
      if (this.openMenuTimeout) {
        clearTimeout(this.openMenuTimeout);
      }
    });
  });

  /**
   * Clear sync checkpoints and trigger a full re-sync.
   */
  async resetSync(): Promise<void> {
    await this.dbResolver.resetSync();
  }

  markWasClosed(): void {
    this.wasClosed.set(true);
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
