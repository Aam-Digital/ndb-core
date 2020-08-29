import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { BackgroundProcessState } from "../background-process-state.interface";

/**
 * A dumb component handling presentation of the sync indicator icon
 * and an additional details dropdown listing all currently running background processes.
 */
@Component({
  selector: "app-background-processing-indicator",
  templateUrl: "./background-processing-indicator.component.html",
  styleUrls: ["./background-processing-indicator.component.scss"],
})
export class BackgroundProcessingIndicatorComponent implements OnChanges {
  /** details on current background processes to be displayed to user */
  @Input() backgroundProcesses: BackgroundProcessState[] = [];

  /** whether processes of with the same title shall be summarized into one line */
  @Input() summarize: boolean = true;

  /** how many special tasks (e.g. index creations) are currently being processed */
  taskCounter: number;

  /** handle to programmatically open/close the details dropdown */
  @ViewChild(MatMenuTrigger) taskListDropdownTrigger: MatMenuTrigger;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.backgroundProcesses) {
      return;
    }

    if (this.summarize && this.backgroundProcesses) {
      this.backgroundProcesses = this.summarizeProcesses(
        this.backgroundProcesses
      );
    }

    this.taskCounter = this.backgroundProcesses?.filter(
      (s) => s.pending
    ).length;

    if (this.taskCounter > 1) {
      if (
        !(
          changes.backgroundProcesses.previousValue?.filter((s) => s.pending)
            .length > 1
        )
      ) {
        // open menu automatically only if it has not been opened previously, to avoid reopening after user closed it
        this.taskListDropdownTrigger?.openMenu();
      }
    } else if (this.taskCounter === 0) {
      this.taskListDropdownTrigger?.closeMenu();
    }
  }

  private summarizeProcesses(
    processes: BackgroundProcessState[]
  ): BackgroundProcessState[] {
    return processes.reduce((accumulator, currentEntry) => {
      const summaryEntry = accumulator.find(
        (i) => i.title === currentEntry.title
      );
      if (!summaryEntry) {
        accumulator.push(currentEntry);
      } else {
        delete summaryEntry.details;
        summaryEntry.pending = summaryEntry.pending || currentEntry.pending;
      }
      return accumulator;
    }, []);
  }
}
