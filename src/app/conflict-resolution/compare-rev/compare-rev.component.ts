import { Component, Input, OnInit } from '@angular/core';
import { diff } from 'deep-object-diff';
import { ConflictResolutionStrategyService } from '../conflict-resolution-strategy/conflict-resolution-strategy.service';
import _ from 'lodash';
import { ConfirmationDialogService } from '../../core/confirmation-dialog/confirmation-dialog.service';
import { Database } from '../../core/database/database';
import { AlertService } from '../../core/alerts/alert.service';

/**
 * Visualize one specific conflicting document revision and offer resolution options.
 */
@Component({
  selector: 'app-compare-rev',
  templateUrl: './compare-rev.component.html',
  styleUrls: ['./compare-rev.component.scss'],
})
export class CompareRevComponent implements OnInit {
  @Input() rev;
  @Input() doc;

  docString;
  revDoc;
  diffs;
  diffsReverse;
  diffsCustom;
  resolution = null;

  constructor(
    private confirmationDialog: ConfirmationDialogService,
    private db: Database,
    private alertService: AlertService,
    private conflictResolver: ConflictResolutionStrategyService,
  ) { }

  ngOnInit() {
    this.loadRev();
  }


  async loadRev() {
    this.revDoc = await this.db.get(this.doc._id, { rev: this.rev });
    const diffObject = diff(this.doc, this.revDoc);
    this.diffs = this.stringify(diffObject);

    const diffReverseObject = diff(this.revDoc, this.doc);
    this.diffsReverse = this.stringify(diffReverseObject);
    this.diffsCustom = this.stringify(diffReverseObject);

    const isIrrelevantConflictingDoc = this.conflictResolver.isIrrelevantConflictVersion(this.doc, this.revDoc);
    if (isIrrelevantConflictingDoc) {
      const success = await this.deleteDoc(this.revDoc);
      if (success) {
        this.resolution = 'automatically deleted trivial conflict';
      }
    }
  }


  stringify(entity: any) {
    return JSON.stringify(
      entity,
      (k, v) => (k === '_rev') ? undefined : v, // ignore "_rev"
      2,
    );
  }



  public resolveByDelete(docToDelete: any) {
    const dialogRef = this.confirmationDialog
      .openDialog(
        'Delete Conflicting Version?',
        'Are you sure you want to keep the current version and delete this conflicting version? '
        + this.stringify(docToDelete),
      );

    dialogRef.afterClosed()
      .subscribe(async confirmed => {
        if (confirmed) {
          const success = await this.deleteDoc(docToDelete);
          if (success) {
            this.resolution = 'deleted conflicting version';
          }
        }
      });
  }

  private async deleteDoc(docToDelete: any): Promise<boolean> {
    try {
      await this.db.remove(docToDelete);
      return true;
    } catch (e) {
      const errorMessage = e.message || e.toString();
      this.alertService.addDanger('Error trying to delete conflicting version: ' + errorMessage);
      return false;
    }
  }

  private async saveDoc(docToSave: any): Promise<boolean> {
    try {
      await this.db.put(docToSave);
      return true;
    } catch (e) {
      const errorMessage = e.message || e.toString();
      this.alertService.addDanger('Error trying to save version: ' + errorMessage);
      return false;
    }
  }


  // TODO: https://www.npmjs.com/package/ngx-text-diff

  public async resolveByManualEdit(diffStringToApply: string) {
    const originalDoc = _.merge({}, this.doc);
    const diffToApply = JSON.parse(diffStringToApply);
    _.merge(this.doc, diffToApply);

    const newChanges = diff(originalDoc, this.doc);

    const dialogRef = this.confirmationDialog
      .openDialog(
        'Save Changes for Conflict Resolution?',
        'Are you sure you want to save the following changes and delete the conflicting version? '
        + this.stringify(newChanges),
    );
    dialogRef.afterClosed()
      .subscribe(async confirmed => {
        if (confirmed) {
          const successSave = await this.saveDoc(this.doc);
          const successDel = await this.deleteDoc(this.revDoc);
          if (successSave && successDel) {
            if (diffStringToApply === this.diffs) {
              this.resolution = 'selected conflicting version';
            } else {
              this.resolution = 'resolved manually';
            }
          }
        }
      });
  }
}
