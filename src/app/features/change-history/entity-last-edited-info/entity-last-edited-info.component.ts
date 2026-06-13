import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog } from "@angular/material/dialog";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { NotificationTimePipe } from "../../notification/notification-time.pipe";
import { Entity } from "../../../core/entity/model/entity";
import { ChangeHistoryService } from "../change-history.service";
import { ChangeHistoryDialogComponent } from "../change-history-dialog/change-history-dialog.component";

/**
 * A small "Change history" icon button (clock-rotate-left) shown next to the
 * entity-actions menu. Opens a popover with created / last-updated metadata
 * (from `entity.created` / `entity.updated`) and a link to the full change
 * history dialog.
 *
 * The metadata is pure entity state, so this widget works regardless of whether
 * the audit backend is deployed (issue #2043).
 */
@Component({
  selector: "app-entity-last-edited-info",
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    FaDynamicIconComponent,
    EntityBlockComponent,
    CustomDatePipe,
    NotificationTimePipe,
  ],
  templateUrl: "./entity-last-edited-info.component.html",
  styleUrls: ["./entity-last-edited-info.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityLastEditedInfoComponent {
  readonly entity = input<Entity>();

  readonly updated = computed(() => this.entity()?.updated);
  readonly created = computed(() => this.entity()?.created);

  private readonly dialog = inject(MatDialog);
  private readonly changeHistory = inject(ChangeHistoryService);

  /**
   * Whether to offer the change-history dialog — same gate as the
   * entity-actions menu entry (the "last updated/created" metadata above is
   * always shown for a saved entity, as it is not audit data).
   */
  readonly canViewHistory = computed(() =>
    this.changeHistory.canViewHistory(this.entity()),
  );

  /** open the full change-history dialog for this entity */
  viewHistory() {
    const entity = this.entity();
    if (!entity || !this.canViewHistory()) {
      return;
    }
    ChangeHistoryDialogComponent.open(this.dialog, entity);
  }
}
