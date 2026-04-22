import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { MatTableModule } from "@angular/material/table";
import { Entity } from "../../../../core/entity/model/entity";
import { DatePipe } from "@angular/common";
import { EntityBlockComponent } from "../../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { applyUpdate } from "../../../../core/entity/model/entity-update";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";

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
    const threshold = this.threshold();
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
          ...entities
            .filter((entity) => entity.isActive && entity[property])
            .map((entity) => ({
              entity: entity,
              birthday: this.getNextBirthday(entity[property]),
              newAge: entity[property]?.age + 1,
            }))
            .filter((entry) => this.daysUntil(entry.birthday) < threshold),
        );
      }
    }

    data.sort(
      (a, b) => this.daysUntil(a.birthday) - this.daysUntil(b.birthday),
    );
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
      const subscriptions: Array<{ unsubscribe: () => void }> = [];
      let isCurrent = true;

      this.entitiesByType.set(new Map());

      for (const entityType of Object.keys(entityConfig)) {
        untracked(async () => {
          const entities = await this.entityMapper.loadType(entityType);
          if (!isCurrent) {
            return;
          }
          this.setEntitiesForType(entityType, entities as Entity[]);
        });

        const subscription = this.entityMapper
          .receiveUpdates(entityType)
          .subscribe((update) => {
            const currentData = this.entitiesByType().get(entityType) ?? [];
            const updatedData = applyUpdate(currentData, update) as Entity[];
            this.setEntitiesForType(entityType, updatedData);
          });
        subscriptions.push(subscription);
      }

      onCleanup(() => {
        isCurrent = false;
        subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    });
  }

  private setEntitiesForType(entityType: string, entities: Entity[]) {
    this.entitiesByType.update((current) => {
      const next = new Map(current);
      next.set(entityType, entities);
      return next;
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

  private daysUntil(date: Date): number {
    const diff = date.getTime() - this.today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

interface EntityPropertyMap {
  [key: string]: string | string[];
}

interface EntityWithBirthday {
  entity: Entity;
  birthday: Date;
  newAge: number;
}
