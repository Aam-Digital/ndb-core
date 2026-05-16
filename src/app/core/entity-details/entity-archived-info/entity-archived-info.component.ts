import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  input,
  linkedSignal,
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Entity } from "../../entity/model/entity";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";

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
export class EntityArchivedInfoComponent {
  protected entityActionsService = inject(EntityActionsService);
  private entityMapper = inject(EntityMapperService);
  entity = input<Entity>();
  protected readonly displayEntity = linkedSignal(() => this.entity());

  constructor() {
    effect((onCleanup) => {
      const entity = this.entity();
      if (!entity) {
        return;
      }
      const sub = this.entityMapper
        .receiveUpdates(entity.getType())
        .subscribe((update) => {
          if (update.entity.getId() === entity.getId()) {
            this.displayEntity.set(update.entity);
          }
        });
      onCleanup(() => sub.unsubscribe());
    });
  }
  }
}
