import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { BackgroundProcessState } from "../background-process-state.interface";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * A dumb component handling presentation of the sync indicator icon
 * and an additional details dropdown listing all currently running background processes.
 */
@UntilDestroy()
@Component({
  selector: "app-background-processing-indicator",
  templateUrl: "./background-processing-indicator.component.html",
  styleUrls: ["./background-processing-indicator.component.scss"],
  imports: [
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    AsyncPipe,
    NgForOf,
    MatProgressSpinnerModule,
    NgIf,
    FontAwesomeModule,
    MatTooltipModule
  ],
  standalone: true
})
export class BackgroundProcessingIndicatorComponent implements OnInit {
  /** details on current background processes to be displayed to user */
  @Input() backgroundProcesses: Observable<BackgroundProcessState[]>;
  filteredProcesses: Observable<BackgroundProcessState[]>;
  taskCounterObservable: Observable<number>;
  allTasksFinished: Observable<boolean>;

  /** whether processes of with the same title shall be summarized into one line */
  @Input() summarize: boolean = true;
  wasClosed: boolean = false;

  /** handle to programmatically open/close the details dropdown */
  @ViewChild(MatMenuTrigger) taskListDropdownTrigger: MatMenuTrigger;

  ngOnInit() {
    this.filteredProcesses = this.backgroundProcesses.pipe(
      map((processes) => this.summarizeProcesses(processes))
    );
    this.taskCounterObservable = this.filteredProcesses.pipe(
      map((processes) => processes.filter((p) => p.pending).length)
    );
    this.allTasksFinished = this.taskCounterObservable.pipe(
      startWith(0),
      map((tc) => tc === 0)
    );
    this.taskCounterObservable
      .pipe(untilDestroyed(this))
      .subscribe((amount) => {
        if (amount === 0) {
          this.taskListDropdownTrigger.closeMenu();
        } else {
          if (!this.wasClosed) {
            // need to wait for change cycle that shows sync button
            setTimeout(() => this.taskListDropdownTrigger.openMenu());
          }
        }
      });
  }

  private combineProcesses(
    first: BackgroundProcessState,
    second: BackgroundProcessState
  ): BackgroundProcessState {
    return {
      title: first.title,
      pending: first.pending || second.pending,
    };
  }

  private summarizeProcesses(
    processes: BackgroundProcessState[]
  ): BackgroundProcessState[] {
    if (!this.summarize) {
      return processes;
    }
    const accumulator: BackgroundProcessState[] = [];
    for (const process of processes) {
      const summaryEntry = accumulator.findIndex(
        (i) => i.title === process.title
      );
      if (summaryEntry === -1) {
        accumulator.push(process);
      } else {
        accumulator[summaryEntry] = this.combineProcesses(
          accumulator[summaryEntry],
          process
        );
      }
    }
    return accumulator;
  }
}
