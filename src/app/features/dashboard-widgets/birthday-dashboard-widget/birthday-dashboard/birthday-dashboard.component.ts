import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { debounceTime, merge } from "rxjs";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { MatTableModule } from "@angular/material/table";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DatePipe } from "@angular/common";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { DashboardListWidgetComponent } from "#src/app/core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import {
  BirthdayDashboardIndexService,
  EntityPropertyMap,
  EntityWithBirthday,
} from "./birthday-dashboard-index.service";

interface BirthdayDashboardConfig {
  entities: EntityPropertyMap;
  threshold: number;
}

@DynamicComponent("BirthdayDashboard")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
  imports: [
    MatTableModule,
    EntityBlockComponent,
    DatePipe,
    DashboardListWidgetComponent,
  ],
})
export class BirthdayDashboardComponent {
  private readonly birthdayIndex = inject(BirthdayDashboardIndexService);
  private readonly entityMapper = inject(EntityMapperService);
  entries = signal<EntityWithBirthday[]>([]);

  static getRequiredEntities(config: BirthdayDashboardConfig) {
    return config?.entities ? Object.keys(config.entities) : "Child";
  }

  /**
   * An object holding the names of entities and properties where they have a `DateOfBirth` attribute.
   * E.g. (which is also the default)
   * ```json
   * "entities": { "Child": "dateOfBirth" }
   * ```
   */
  entities = input<EntityPropertyMap>({ ["Child"]: "dateOfBirth" });

  /**
   * Birthdays that are less than "threshold" days away are shown.
   * Default 32
   */
  threshold = input(32);

  subtitle = input<string>(
    $localize`:dashboard widget subtitle:Upcoming Birthdays`,
  );
  explanation = input<string>();

  constructor() {
    effect((onCleanup) => {
      const entityConfig = this.entities();
      const threshold = this.threshold();
      let isCurrent = true;

      // Built once per entities()/threshold() change only - not re-run by reload()
      // below, since PUTting the design doc isn't free and the index structure only
      // depends on entityConfig, not on entity data.
      const indexBuilt = this.birthdayIndex.buildBirthdayIndex(entityConfig);

      const reload = () =>
        indexBuilt
          .then(() =>
            this.birthdayIndex.queryBirthdayIndex(entityConfig, threshold),
          )
          .then((res) => {
            if (isCurrent) {
              this.entries.set(res);
            }
          });

      // initial load - covers the case where matching entities already exist on mount.
      reload();

      // Re-query (cheap/incremental) whenever a relevant entity type changes, so the
      // widget picks up entities added/edited after the initial query (e.g. while the
      // index was still empty during sync/demo-data generation), and stays live for
      // ongoing changes. Debounced because e.g. demo-data generation saves many
      // entities in a burst - without this, that's one redundant query per save.
      const subscription = merge(
        ...Object.keys(entityConfig).map((type) =>
          this.entityMapper.receiveUpdates(type),
        ),
      )
        .pipe(debounceTime(500))
        .subscribe(() => reload());

      onCleanup(() => {
        isCurrent = false;
        subscription.unsubscribe();
      });
    });
  }
}
