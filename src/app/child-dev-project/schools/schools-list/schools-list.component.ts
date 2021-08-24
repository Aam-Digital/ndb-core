import { Component, OnInit, ViewChild } from "@angular/core";
import { School } from "../model/school";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";

@UntilDestroy()
@Component({
  selector: "app-schools-list",
  template: `
    <app-entity-list
      [allEntities]="schoolList"
      [listConfig]="listConfig"
      [entityConstructor]="schoolConstructor"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
      #entityList
    ></app-entity-list>
  `,
})
export class SchoolsListComponent implements OnInit {
  @ViewChild("entityList") entityList: EntityListComponent<School>;
  schoolList: School[] = [];
  listConfig: EntityListConfig;
  schoolConstructor = School;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.data.subscribe(
      (data: RouteData<EntityListConfig>) => (this.listConfig = data.config)
    );
    this.entityMapper
      .loadType<School>(School)
      .then((data) => (this.schoolList = data));
  }

  routeTo(route: string) {
    const path = "/" + School.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, route]);
  }
}
