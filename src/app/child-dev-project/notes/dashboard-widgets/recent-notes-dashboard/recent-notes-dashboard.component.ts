import { Component, Input, OnInit } from '@angular/core';
import { ChildrenService } from '../../../children/children.service';
import { Router } from '@angular/router';
import { Child } from '../../../children/model/child';
import { Note } from '../../model/note';

@Component({
  selector: 'app-recent-notes-dashboard',
  templateUrl: './recent-notes-dashboard.component.html',
  styleUrls: ['./recent-notes-dashboard.component.scss'],
})
export class RecentNotesDashboardComponent implements OnInit {

  /** time period (in days) that the widget will consider checking for notes of a child */
  @Input() sinceDays: number;

  /** whether to list children _without_ recent notes instead of those having notes */
  @Input() showMissing: boolean;

  concernedChildren: Child[] = [];


  constructor(
    private childrenService: ChildrenService,
    private router: Router,
  ) { }

  async ngOnInit() {
    await this.loadConcernedChildren();
  }

  recordTrackByFunction = (index, item) => item.childId;

  async loadConcernedChildren() {
    this.concernedChildren = [];

    const children = await this.childrenService.getChildren().toPromise();
    for (const child of children) {
      const childHasRecentNotes = await this.hasRecentNotes(child);
      if (childHasRecentNotes && !this.showMissing) {
        this.concernedChildren.push(child);
      } else if (!childHasRecentNotes && this.showMissing) {
        this.concernedChildren.push(child);
      }
    }
  }

  /**
   * Check the given Child's notes in the database whether there is recent Notes
   * as defined by the "sinceDays" input property.
   * @param child The child entity to be checked
   */
  private async hasRecentNotes(child: Child): Promise<boolean> {
    let childsNotes: Note[] = await this.childrenService.getNotesOfChild(child.getId()).toPromise();
    childsNotes = childsNotes
      .filter(n => n.date)
      .sort((a, b) => (b.date.valueOf() - a.date.valueOf()) );

    if (childsNotes.length === 0) {
      return false;
    }

    return (this.dateDiffInDays(childsNotes[0].date, new Date()) <= this.sinceDays);
  }

  dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  }


  goToChild(childId: string) {
    this.router.navigate(['/child', childId]);
  }
}
