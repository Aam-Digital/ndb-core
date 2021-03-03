import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { School } from "../model/school";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";
import { Subscription } from "rxjs";
import { updateEntities } from "../../../core/entity/entity-update";

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
export class SchoolsListComponent implements OnInit, OnDestroy {
  @ViewChild("entityList") entityList: EntityListComponent<School>;
  schoolList: School[] = [];
  listConfig: any = {};
  private subscription: Subscription;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.data.subscribe((config) => (this.listConfig = config));
    this.subscription = this.entityMapper
      .loadAll<School>(School)
      .pipe(updateEntities())
      .subscribe((update) => {
        this.schoolList = update(this.schoolList);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  routeTo(route: string) {
    const path = "/" + School.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, route]);
  }
}
