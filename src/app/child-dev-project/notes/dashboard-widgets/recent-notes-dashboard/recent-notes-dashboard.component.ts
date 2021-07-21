import { Component, Input, OnInit } from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import moment from "moment";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";

/**
 * Dashboard Widget displaying children that have a recently added Note.
 */
@Component({
  selector: "app-recent-notes-dashboard",
  templateUrl: "./recent-notes-dashboard.component.html",
  styleUrls: ["./recent-notes-dashboard.component.scss"],
})
export class RecentNotesDashboardComponent
  implements OnInitDynamicComponent, OnInit {
  /**
   * number of days since last note that children should be considered having a "recent" note.
   */
  @Input() sinceDays: number = 0;

  /** Whether an additional offset should be automatically added to include notes from the beginning of the week */
  @Input() fromBeginningOfWeek = true;

  /** true while data is not ready/available yet */
  isLoading: boolean;

  /** number of children with recent notes */
  count: number = 0;

  constructor(private childrenService: ChildrenService) {}

  onInitFromDynamicConfig(config: any) {
    if (config?.sinceDays) {
      this.sinceDays = config.sinceDays;
    }
    if (config?.fromBeginningOfWeek) {
      this.fromBeginningOfWeek = config.fromBeginningOfWeek;
    }
  }

  async ngOnInit() {
    await this.loadConcernedChildrenFromIndex();
  }

  private async loadConcernedChildrenFromIndex() {
    this.isLoading = true;

    let dayRangeBoundary = this.sinceDays;
    if (this.fromBeginningOfWeek) {
      dayRangeBoundary += moment().diff(moment().startOf("week"), "days");
    }

    this.count = Array.from(
      await this.childrenService.getDaysSinceLastNoteOfEachChild(
        dayRangeBoundary
      )
    ).filter((stat) => stat[1] <= dayRangeBoundary).length;

    this.isLoading = false;
  }

  get tooltip(): string {
    return $localize`:Tooltip|Spaces in front of the variables are added automatically:includes children without a note${this.sinceBeginningOfTheWeek}:sinceBeginningOfWeek:${this.withinTheLastNDays}:withinTheLastDays:`;
  }

  get sinceBeginningOfTheWeek(): string {
    if (this.fromBeginningOfWeek) {
      return (
        " " +
        $localize`:Tooltip-part|'includes children without a note since the beginning of the week':since the beginning of the week`
      );
    }
  }

  get withinTheLastNDays(): string {
    if (this.sinceDays > 0) {
      return (
        " " +
        $localize`:Tooltip-part|'includes children without a note within the last x days':without a note within the last ${this.sinceDays} days`
      );
    }
  }
}
