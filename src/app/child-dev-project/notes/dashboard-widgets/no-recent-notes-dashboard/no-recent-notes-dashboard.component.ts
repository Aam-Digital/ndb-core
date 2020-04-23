import { Component, Input, OnInit } from '@angular/core';
import { ChildrenService } from '../../../children/children.service';
import { Child } from '../../../children/model/child';
import moment from 'moment';

/**
 * Dashboard Widget displaying children that do not have a recently added Note.
 */
@Component({
  selector: 'app-no-recent-notes-dashboard',
  templateUrl: './no-recent-notes-dashboard.component.html',
  styleUrls: ['./no-recent-notes-dashboard.component.scss'],
})
export class NoRecentNotesDashboardComponent implements OnInit {
  /**
   * number of days since last note that children should be considered having a "recent" note.
   *
   * Defaults to beginning of the current week
   */
  @Input() sinceDays: number = moment().startOf('day').diff(moment().startOf('week'), 'days');

  /** true while data is not ready/available yet */
  isLoading: boolean;

  /** children displayed in the template
   * Child entities with additional "daysSinceLastNote" field
   */
  concernedChildren: ChildWithRecentNoteInfo[] = [];


  constructor(
    private childrenService: ChildrenService,
  ) { }

  async ngOnInit() {
    await this.loadConcernedChildrenFromIndex();
  }

  private async loadConcernedChildrenFromIndex() {
    this.isLoading = true;

    const children = (await this.childrenService.getChildren().toPromise() as ChildWithRecentNoteInfo[])
      .filter(c => c.isActive());

    const lastNoteStats = await this.childrenService.getDaysSinceLastNoteOfEachChild();

    const resultChildren = [];
    for (const child of children) {
      if (lastNoteStats.has(child.getId())) {
        child.daysSinceLastNote = lastNoteStats.get(child.getId());
        if (child.daysSinceLastNote > this.sinceDays) {
          resultChildren.push(child);
        }
      } else {
        child.daysSinceLastNote = 0;
        resultChildren.push(child);
      }
    }

    this.concernedChildren = resultChildren.sort((a, b) => b.daysSinceLastNote - a.daysSinceLastNote);

    this.isLoading = false;
  }
}

type ChildWithRecentNoteInfo = Child & { daysSinceLastNote: number };
