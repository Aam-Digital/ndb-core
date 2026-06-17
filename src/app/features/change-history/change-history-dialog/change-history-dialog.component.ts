import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from "@angular/core";
import { AsyncPipe } from "@angular/common";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { HintBoxComponent } from "../../../core/common-components/hint-box/hint-box.component";
import { FeatureDisabledInfoComponent } from "../../../core/common-components/feature-disabled-info/feature-disabled-info.component";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { NotificationTimePipe } from "../../notification/notification-time.pipe";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { ChangeHistoryService } from "../change-history.service";
import { ChangeEvent } from "../change-history.types";
import { ChangeHistoryActionBadgeComponent } from "../change-history-action-badge/change-history-action-badge.component";
import { RecordDiffComponent } from "../record-diff/record-diff.component";

export interface ChangeHistoryDialogData {
  entity: Entity;
}

/**
 * Dialog showing an entity's change history as a reverse-chronological
 * accordion timeline (one row per change). The newest row is expanded by
 * default; expanding a row reveals its field-level before -> after diff.
 */
@Component({
  selector: "app-change-history-dialog",
  standalone: true,
  imports: [
    AsyncPipe,
    MatDialogModule,
    MatButtonModule,
    MatExpansionModule,
    MatProgressBarModule,
    FaDynamicIconComponent,
    DialogCloseComponent,
    HintBoxComponent,
    FeatureDisabledInfoComponent,
    EntityBlockComponent,
    CustomDatePipe,
    NotificationTimePipe,
    ChangeHistoryActionBadgeComponent,
    RecordDiffComponent,
  ],
  templateUrl: "./change-history-dialog.component.html",
  styleUrls: ["./change-history-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeHistoryDialogComponent {
  /** Open the change-history dialog for an entity (single source of sizing/data). */
  static open(
    dialog: MatDialog,
    entity: Entity,
  ): MatDialogRef<ChangeHistoryDialogComponent> {
    return dialog.open(ChangeHistoryDialogComponent, {
      data: { entity } satisfies ChangeHistoryDialogData,
      width: "98vw",
      maxWidth: "99vw",
    });
  }

  private readonly service = inject(ChangeHistoryService);
  private readonly data = inject<ChangeHistoryDialogData>(MAT_DIALOG_DATA);

  readonly entity: Entity = this.data.entity;
  readonly entityType: EntityConstructor = this.entity.getConstructor();

  /**
   * The entity's own created / last-updated metadata. Pure entity state, so it
   * is always shown — even when the audit history below is unavailable.
   */
  readonly updated = this.entity.updated;
  readonly created = this.entity.created;

  /** backend feature flag (undefined while loading, then true/false) */
  readonly auditEnabled = this.service.isAuditEnabled;
  /** whether the user may read the audit data */
  readonly hasPermission = this.service.hasHistoryPermission();

  /** null while loading, then the loaded (possibly empty) list */
  readonly events = signal<ChangeEvent[] | null>(null);
  /** true when the audit-db read failed despite the feature being enabled */
  readonly loadError = signal(false);

  private fetchStarted = false;

  constructor() {
    // trigger the (lazy) backend feature-flag fetch now that the dialog is open
    this.service.loadAuditFeatureFlag();
    // Fetch the history once we know the feature is enabled and the user is
    // permitted. Driven by the feature-flag signal so a no-backend deployment
    // resolves to "disabled" (clean notice) rather than an audit-db read error.
    effect(() => {
      if (
        this.auditEnabled() === true &&
        this.hasPermission &&
        !this.fetchStarted
      ) {
        this.fetchStarted = true;
        void this.loadHistory();
      }
    });
  }

  private async loadHistory() {
    try {
      this.events.set(await this.service.getHistory(this.entity));
    } catch {
      this.loadError.set(true);
      this.events.set([]);
    }
  }
}
