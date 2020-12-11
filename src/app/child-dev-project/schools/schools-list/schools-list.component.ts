import { Component, OnInit, ViewChild } from "@angular/core";
import { School } from "../model/school";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";

@UntilDestroy()
@Component({
  selector: "app-schools-list",
  template: `
    <app-entity-list
      [entityList]="schoolList"
      [listConfig]="listConfig"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
      #entityList
    ></app-entity-list>
  `,
})
export class SchoolsListComponent implements OnInit {
  @ViewChild("entityList") entityList: EntityListComponent<School>;
  schoolList: School[] = [];
  listConfig: any = {};

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.data.subscribe((config) => (this.listConfig = config));
    this.entityMapper
      .loadType<School>(School)
      .then((data) => (this.schoolList = data));
  }

  routeTo(route: string) {
    this.router.navigate(["/school", route]);
  }
}
