import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import moment from "moment";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { Child } from "../../../children/model/child";

/**
 * Dashboard Widget displaying children that do not have a recently added Note.
 *
 * If you do not set "sinceDays" of "fromBeginningOfWeek" inputs
 * by default notes since beginning of the current week are considered.
 */
@DynamicComponent("NotesDashboard")
@Component({
  selector: "app-no-recent-notes-dashboard",
  templateUrl: "./notes-dashboard.component.html",
  styleUrls: ["./notes-dashboard.component.scss"],
})
export class NotesDashboardComponent
  implements OnInitDynamicComponent, OnInit, AfterViewInit
{
  /**
   * number of days since last note that children should be considered having a "recent" note.
   */
  @Input() sinceDays: number = 0;

  /** Whether an additional offset should be automatically added to include notes from the beginning of the week */
  @Input() fromBeginningOfWeek = true;

  mode: "with-recent-notes" | "without-recent-notes";

  /**
   * Children displayed in the template
   * Child entities with additional "daysSinceLastNote" field
   */
  dataSource = new MatTableDataSource<ChildWithRecentNoteInfo>();
  @ViewChild("paginator") paginator: MatPaginator;

  isLoading = true;

  constructor(private childrenService: ChildrenService) {}

  onInitFromDynamicConfig(config: any) {
    if (config?.sinceDays) {
      this.sinceDays = config.sinceDays;
    }
    if (config?.fromBeginningOfWeek) {
      this.fromBeginningOfWeek = config.fromBeginningOfWeek;
    }
    this.mode = config?.mode;
  }

  ngOnInit() {
    let dayRangeBoundary = this.sinceDays;
    if (this.fromBeginningOfWeek) {
      dayRangeBoundary += moment().diff(moment().startOf("week"), "days");
    }
    switch (this.mode) {
      case "with-recent-notes":
        this.loadConcernedChildren(
          (stat) => stat[1] <= dayRangeBoundary,
          dayRangeBoundary
        );
        break;
      case "without-recent-notes":
        this.loadConcernedChildren(
          (stat) => stat[1] >= dayRangeBoundary,
          dayRangeBoundary
        );
    }
  }

  get subtitle(): string {
    switch (this.mode) {
      case "without-recent-notes":
        return $localize`:Subtitle|Subtitle informing the user that these are the children without recent reports:Having no recent reports`;
      case "with-recent-notes":
        return $localize`:Subtitle|Subtitle informing the user that these are the children with recent reports:${Child.labelPlural} with recent report`;
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private async loadConcernedChildren(
    filter: (stat: [string, number]) => boolean,
    dayRangeBoundary: number
  ) {
    const queryRange = Math.round((dayRangeBoundary * 3) / 10) * 10; // query longer range to be able to display exact date of last note for recent

    // recent notes are sorted ascending, without recent notes descending
    const order = this.mode === "with-recent-notes" ? -1 : 1;
    const children = await this.childrenService.getDaysSinceLastNoteOfEachChild(
      queryRange
    );
    this.dataSource.data = Array.from(children)
      .filter(filter)
      .map((stat) => statsToChildWithRecentNoteInfo(stat, queryRange))
      .sort((a, b) => order * (b.daysSinceLastNote - a.daysSinceLastNote));

    this.isLoading = false;
  }

  get tooltip(): string {
    switch (this.mode) {
      case "with-recent-notes":
        return $localize`:Tooltip|Spaces in front of the variables are added automatically:includes cases with a note${this.sinceBeginningOfTheWeek}:sinceBeginningOfWeek:${this.withinTheLastNDays}:withinTheLastDays:`;
      case "without-recent-notes":
        return $localize`:Tooltip|Spaces in front of the variables are added automatically:includes cases without a note${this.sinceBeginningOfTheWeek}:sinceBeginningOfWeek:${this.withinTheLastNDays}:withinTheLastDays:`;
    }
  }

  get sinceBeginningOfTheWeek(): string {
    if (this.fromBeginningOfWeek) {
      return (
        " " +
        $localize`:Tooltip-part|'includes cases without a note since the beginning of the week':since the beginning of the week`
      );
    }
  }

  get withinTheLastNDays(): string {
    if (this.sinceDays > 0) {
      return (
        " " +
        $localize`:Tooltip-part|'includes cases without a note within the last x days':without a note within the last ${this.sinceDays} days`
      );
    }
  }
}

/**
 * details on child stats to be displayed
 */
interface ChildWithRecentNoteInfo {
  childId: string;
  daysSinceLastNote: number;
  /** true when the daysSinceLastNote is not accurate but was cut off for performance optimization */
  moreThanDaysSince: boolean;
}

/**
 * Map a result entry from getDaysSinceLastNoteOfEachChild to the ChildWithRecentNoteInfo interface
 * @param stat Array of [childId, daysSinceLastNote]
 * @param queryRange The query range (the maximum of days that exactly calculated)
 */
function statsToChildWithRecentNoteInfo(
  stat: [string, number],
  queryRange: number
): ChildWithRecentNoteInfo {
  if (stat[1] < Number.POSITIVE_INFINITY) {
    return {
      childId: stat[0],
      daysSinceLastNote: stat[1],
      moreThanDaysSince: false,
    };
  } else {
    return {
      childId: stat[0],
      daysSinceLastNote: queryRange,
      moreThanDaysSince: true,
    };
  }
}
