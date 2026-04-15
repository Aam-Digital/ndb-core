import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Entity } from "../../entity/model/entity";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Subscription } from "rxjs";

/**
 * Informs users that the entity is inactive (or anonymized) and provides options to change the status.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-archived-info",
  imports: [MatCardModule, MatButtonModule, FontAwesomeModule],
  templateUrl: "./entity-archived-info.component.html",
  styleUrls: ["./entity-archived-info.component.scss"],
})
export class EntityArchivedInfoComponent implements OnDestroy {
  protected entityActionsService = inject(EntityActionsService);
  private entityMapper = inject(EntityMapperService);
  private cdr = inject(ChangeDetectorRef);
  private updatesSubscription?: Subscription;

  @Input() set entity(value: Entity) {
    this._entity = value;
    this.subscribeToEntityUpdates();
  }
  get entity(): Entity {
    return this._entity;
  }
  private _entity!: Entity;

  ngOnDestroy(): void {
    this.updatesSubscription?.unsubscribe();
  }

  private subscribeToEntityUpdates() {
    this.updatesSubscription?.unsubscribe();
    if (!this._entity) {
      return;
    }

    this.updatesSubscription = this.entityMapper
      .receiveUpdates(this._entity.getType())
      .subscribe((update) => {
        if (update.entity.getId() === this._entity.getId()) {
          this._entity = update.entity;
          this.cdr.markForCheck();
        }
      });
  }
}
