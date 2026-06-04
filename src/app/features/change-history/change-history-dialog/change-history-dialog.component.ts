import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
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
export class ChangeHistoryDialogComponent implements OnInit {
  /** Open the change-history dialog for an entity (single source of sizing/data). */
  static open(
    dialog: MatDialog,
    entity: Entity,
  ): MatDialogRef<ChangeHistoryDialogComponent> {
    return dialog.open(ChangeHistoryDialogComponent, {
      data: { entity } satisfies ChangeHistoryDialogData,
      width: "1000px",
      maxWidth: "95vw",
    });
  }

  private readonly service = inject(ChangeHistoryService);
  private readonly data = inject<ChangeHistoryDialogData>(MAT_DIALOG_DATA);

  readonly entity: Entity = this.data.entity;
  readonly entityType: EntityConstructor = this.entity.getConstructor();

  /** null while loading, then the loaded (possibly empty) list */
  readonly events = signal<ChangeEvent[] | null>(null);
  /** true when the audit db could not be read (not enabled / no access) */
  readonly loadError = signal(false);

  async ngOnInit() {
    try {
      this.events.set(await this.service.getHistory(this.entity));
    } catch {
      this.loadError.set(true);
      this.events.set([]);
    }
  }
}
