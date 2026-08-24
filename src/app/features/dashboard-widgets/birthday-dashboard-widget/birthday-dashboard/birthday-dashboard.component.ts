import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { debounceTime, merge } from "rxjs";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { MatTableModule } from "@angular/material/table";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DatePipe } from "@angular/common";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { DashboardListWidgetComponent } from "#src/app/core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import {
  BirthdayDashboardIndexService,
  EntityPropertyMap,
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
  private birthdayIndex = inject(BirthdayDashboardIndexService);
  private entityMapper = inject(EntityMapperService);
  private entitiesByType = signal<Map<string, Entity[]>>(new Map());

  static getRequiredEntities(config: BirthdayDashboardConfig) {
    return config?.entities ? Object.keys(config.entities) : "Child";
  }

  private readonly today: Date;

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

  entries = computed(() => {
    const dataByType = this.entitiesByType();
    const entityConfig = this.entities();
    const data: EntityWithBirthday[] = [];

    for (const [entityType, properties] of Object.entries(entityConfig)) {
      const entities = dataByType.get(entityType) ?? [];
      const propertyList = Array.isArray(properties)
        ? properties
        : [properties];

      for (const property of propertyList) {
        data.push(
          ...entities.map((entity) => ({
            entity: entity,
            birthday: this.getNextBirthday(entity[property]),
            newAge: entity[property]?.age + 1,
          })),
        );
      }
    }
    return data;
  });

  subtitle = input<string>(
    $localize`:dashboard widget subtitle:Upcoming Birthdays`,
  );
  explanation = input<string>();

  constructor() {
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);

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
              this.entitiesByType.set(res);
            }
          });

      // initial load - covers the case where matching entities already exist on mount.
      void reload();

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

  private getNextBirthday(dateOfBirth: Date): Date {
    const birthday = new Date(
      this.today.getFullYear(),
      dateOfBirth.getMonth(),
      dateOfBirth.getDate(),
    );

    if (this.today.getTime() > birthday.getTime()) {
      birthday.setFullYear(birthday.getFullYear() + 1);
    }
    return birthday;
  }
}

interface EntityWithBirthday {
  entity: Entity;
  birthday: Date;
  newAge: number;
}
