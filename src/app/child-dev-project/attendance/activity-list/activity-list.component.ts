import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { RecurringActivity } from "../model/recurring-activity";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

@Component({
  selector: "app-activity-list",
  template: `
    <app-entity-list
      [entityList]="entities"
      [listConfig]="listConfig"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
    ></app-entity-list>
  `,
})
export class ActivityListComponent implements OnInit {
  entities: RecurringActivity[] = [];
  listConfig: any = {};

  constructor(
    private entityService: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.route.data.subscribe((config) => (this.listConfig = config));
    this.entities = await this.entityService.loadType<RecurringActivity>(
      RecurringActivity
    );
  }

  routeTo(route: string) {
    this.router.navigate(["/recurring-activity", route]);
  }
}
