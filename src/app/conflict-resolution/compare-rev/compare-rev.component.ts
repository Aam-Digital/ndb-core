import { Component, Input } from "@angular/core";
import { diff } from "deep-object-diff";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../core/database/database";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AutoResolutionService } from "../auto-resolution/auto-resolution.service";
import { merge } from "lodash-es";
import { MatExpansionModule } from "@angular/material/expansion";
import { NgIf } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";

/**
 * Visualize one specific conflicting document revision and offer resolution options.
 */
@Component({
  selector: "app-compare-rev",
  templateUrl: "./compare-rev.component.html",
  styleUrls: ["./compare-rev.component.scss"],
  imports: [
    MatExpansionModule,
    NgIf,
    MatTooltipModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
  ],
  standalone: true,
})
export class CompareRevComponent {
  /** revision key (_rev) of the confliction version to be displayed */
  @Input() rev: string;

  /** document from the database in the current version */
  @Input() doc: any;

  /** used in the template for a tooltip displaying the full document */
  docString: string;

  /** document from the database in the conflicting version */
  revDoc: any;

  /** changes the conflicting doc has compared to the current doc */
  diffs;

  /** changes the current doc has compared to the conflicting doc.
   *
   * This mirrors `diffs` but shows the things that would be added if the current doc would
   * overwrite the conflicting version instead of the other way round.
   */
  diffsReverse;

  /** the user edited diff that can be applied as an alternative resolution (initialized with same value as `diffs`) */
  diffsCustom;

  /** whether/how this conflict has been resolved */
  resolution: string = null;

  constructor(
    private db: Database,
    private confirmationDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private conflictResolver: AutoResolutionService,
  ) {}

  /**
   * Load the document version (revision) to be displayed and generate the diffs to be visualized.
   */
  public async loadRev() {
    this.revDoc = await this.db.get(this.doc._id, { rev: this.rev });
    const diffObject = diff(this.doc, this.revDoc);
    this.diffs = this.stringify(diffObject);

    const diffReverseObject = diff(this.revDoc, this.doc);
    this.diffsReverse = this.stringify(diffReverseObject);
    this.diffsCustom = this.stringify(diffReverseObject);

    const isIrrelevantConflictingDoc =
      this.conflictResolver.shouldDeleteConflictingRevision(
        this.doc,
        this.revDoc,
      );
    if (isIrrelevantConflictingDoc) {
      const success = await this.deleteDoc(this.revDoc);
      if (success) {
        this.resolution = $localize`automatically deleted trivial conflict`;
      }
    }
  }

  /**
   * Generate a human-readable string of the given object.
   * @param entity Object to be stringified
   */
  stringify(entity: any) {
    return JSON.stringify(
      entity,
      (k, v) => (k === "_rev" ? undefined : v), // ignore "_rev"
      2,
    );
  }

  /**
   * Resolve the displayed conflict by deleting the conflicting revision doc and keeping the current doc.
   * @param docToDelete Document to be deleted
   */
  public async resolveByDelete(docToDelete: any) {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Delete Conflicting Version?`,
      $localize`Are you sure you want to keep the current version and delete this conflicting version? ${this.stringify(
        docToDelete,
      )}`,
    );

    if (confirmed) {
      const success = await this.deleteDoc(docToDelete);
      if (success) {
        this.resolution = $localize`deleted conflicting version`;
      }
    }
  }

  private async deleteDoc(docToDelete: any): Promise<boolean> {
    try {
      await this.db.remove(docToDelete);
      return true;
    } catch (e) {
      const errorMessage = e.message || e.toString();
      this.snackBar.open(
        $localize`Error trying to delete conflicting version: ${errorMessage}`,
      );
      return false;
    }
  }

  private async saveDoc(docToSave: any): Promise<boolean> {
    try {
      await this.db.put(docToSave);
      return true;
    } catch (e) {
      const errorMessage = e.message || e.toString();
      this.snackBar.open(
        $localize`Error trying to save version: ${errorMessage}`,
      );
      return false;
    }
  }

  /**
   * Apply the given diff, save the resulting new document to the database
   * and remove the conflicting document, thereby resolving the conflict.
   *
   * This method is also used to resolve the conflict to keep the conflicting version instead of the current doc.
   * Then this simply applies the diff of the existing conflicting version instead of a user-edited diff.
   *
   * @param diffStringToApply The (user-edited) diff to be applied to the current doc
   */
  public async resolveByManualEdit(diffStringToApply: string) {
    const originalDoc = merge({}, this.doc);
    const diffToApply = JSON.parse(diffStringToApply);
    merge(this.doc, diffToApply);

    const newChanges = diff(originalDoc, this.doc);

    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Save Changes for Conflict Resolution?`,
      $localize`Are you sure you want to save the following changes and delete the conflicting version? ${this.stringify(
        newChanges,
      )}`,
    );
    if (confirmed) {
      const successSave = await this.saveDoc(this.doc);
      const successDel = await this.deleteDoc(this.revDoc);
      if (successSave && successDel) {
        if (diffStringToApply === this.diffs) {
          this.resolution = $localize`selected conflicting version`;
        } else {
          this.resolution = $localize`resolved manually`;
        }
      }
    }
  }
}
