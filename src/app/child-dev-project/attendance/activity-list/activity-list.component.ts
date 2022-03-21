import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { RecurringActivity } from "../model/recurring-activity";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { RouteTarget } from "../../../app.routing";

@RouteTarget("ActivityList")
@Component({
  selector: "app-activity-list",
  template: `
    <app-entity-list
      [allEntities]="entities"
      [listConfig]="listConfig"
      [entityConstructor]="activityConstructor"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
    ></app-entity-list>
  `,
})
export class ActivityListComponent implements OnInit {
  entities: RecurringActivity[] = [];
  listConfig: EntityListConfig;
  activityConstructor = RecurringActivity;

  constructor(
    private entityMapper: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.route.data.subscribe(
      (data: RouteData<EntityListConfig>) => (this.listConfig = data.config)
    );
    this.entities = await this.entityMapper.loadType<RecurringActivity>(
      RecurringActivity
    );
  }

  routeTo(route: string) {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
