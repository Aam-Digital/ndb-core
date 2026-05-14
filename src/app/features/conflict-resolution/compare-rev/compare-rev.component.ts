import {
  Component,
  input,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { diff } from "deep-object-diff";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../../core/database/database";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AutoResolutionService } from "../auto-resolution/auto-resolution.service";
import { merge } from "lodash-es";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { DatabaseResolverService } from "../../../core/database/database-resolver.service";
import { DatabaseDocChange } from "../../../core/database/database";

/**
 * Visualize one specific conflicting document revision and offer resolution options.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-compare-rev",
  templateUrl: "./compare-rev.component.html",
  styleUrls: ["./compare-rev.component.scss"],
  imports: [
    MatExpansionModule,
    MatTooltipModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
  ],
})
export class CompareRevComponent {
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackBar = inject(MatSnackBar);
  private conflictResolver = inject(AutoResolutionService);

  /** revision key (_rev) of the confliction version to be displayed */
  rev = input<string>();

  /** document from the database in the current version */
  doc = input<DatabaseDocChange>();

  /** used in the template for a tooltip displaying the full document */
  docString: string;

  /** document from the database in the conflicting version */
  revDoc!: DatabaseDocChange;

  /** changes the conflicting doc has compared to the current doc */
  diffs: string;

  /** changes the current doc has compared to the conflicting doc.
   *
   * This mirrors `diffs` but shows the things that would be added if the current doc would
   * overwrite the conflicting version instead of the other way round.
   */
  diffsReverse: string;

  /** the user edited diff that can be applied as an alternative resolution (initialized with same value as `diffs`) */
  diffsCustom: string;

  /** whether/how this conflict has been resolved */
  resolution: string | null = null;

  private readonly db: Database;

  constructor() {
    const dbResolver = inject(DatabaseResolverService);

    this.db = dbResolver.getDatabase();
  }

  /**
   * Load the document version (revision) to be displayed and generate the diffs to be visualized.
   */
  public async loadRev() {
    const doc = this.doc();
    if (!doc) {
      return;
    }
    this.revDoc = await this.db.get(doc._id, { rev: this.rev() });
    const diffObject = diff(doc, this.revDoc);
    this.diffs = this.stringify(diffObject);

    const diffReverseObject = diff(this.revDoc, doc);
    this.diffsReverse = this.stringify(diffReverseObject);
    this.diffsCustom = this.stringify(diffReverseObject);

    const isIrrelevantConflictingDoc =
      this.conflictResolver.shouldDeleteConflictingRevision(doc, this.revDoc);
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
  stringify(entity: unknown): string {
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
  public async resolveByDelete(docToDelete: DatabaseDocChange) {
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

  private async deleteDoc(docToDelete: DatabaseDocChange): Promise<boolean> {
    try {
      await this.db.remove(docToDelete);
      return true;
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e) || String(e);
      this.snackBar.open(
        $localize`Error trying to delete conflicting version: ${errorMessage}`,
      );
      return false;
    }
  }

  private async saveDoc(docToSave: DatabaseDocChange): Promise<boolean> {
    try {
      await this.db.put(docToSave);
      return true;
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e) || String(e);
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
    const doc = this.doc();
    if (!doc) {
      return;
    }
    const originalDoc = merge({}, doc) as DatabaseDocChange;
    const diffToApply = JSON.parse(diffStringToApply);
    const mergedDoc = merge({}, doc, diffToApply) as DatabaseDocChange;

    const newChanges = diff(originalDoc, mergedDoc);

    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`Save Changes for Conflict Resolution?`,
      $localize`Are you sure you want to save the following changes and delete the conflicting version? ${this.stringify(
        newChanges,
      )}`,
    );
    if (confirmed) {
      const successSave = await this.saveDoc(mergedDoc);
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
