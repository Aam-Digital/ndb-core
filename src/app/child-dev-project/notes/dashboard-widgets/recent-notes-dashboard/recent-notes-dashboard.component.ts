import { Component, Input, OnInit } from '@angular/core';
import { ChildrenService } from '../../../children/children.service';
import moment from 'moment';

/**
 * Dashboard Widget displaying children that have a recently added Note.
 */
@Component({
  selector: 'app-recent-notes-dashboard',
  templateUrl: './recent-notes-dashboard.component.html',
  styleUrls: ['./recent-notes-dashboard.component.scss'],
})
export class RecentNotesDashboardComponent implements OnInit {
  /**
   * number of days since last note that children should be considered having a "recent" note.
   */
  @Input() sinceDays: number = 0;

  /** Whether an additional offset should be automatically added to include notes from the beginning of the week */
  @Input() fromBeginningOfWeek = true;

  /** The offset in days since beginning of the week (used for "fromBeginningOfWeek" option) */
  private daysSinceBeginningOfWeek = moment().startOf('day').diff(moment().startOf('week'), 'days');

  /** true while data is not ready/available yet */
  isLoading: boolean;

  /** number of children with recent notes */
  count: number = 0;


  constructor(
    private childrenService: ChildrenService,
  ) { }

  async ngOnInit() {
    await this.loadConcernedChildrenFromIndex();
  }

  private async loadConcernedChildrenFromIndex() {
    this.isLoading = true;

    const lastNoteStats = await this.childrenService.getDaysSinceLastNoteOfEachChild();

    this.count = 0;
    for (const entry of lastNoteStats.entries()) {
      if (this.isWithinDayRange(entry[1])) {
        this.count++;
      }
    }

    this.isLoading = false;
  }

  private isWithinDayRange(daysSinceLastNote: number) {
    if (this.fromBeginningOfWeek) {
      return daysSinceLastNote <= (this.sinceDays + this.daysSinceBeginningOfWeek);
    } else {
      return daysSinceLastNote <= this.sinceDays;
    }
  }
}
