import { Component, OnInit } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ChildrenService } from "../children.service";

@UntilDestroy()
@Component({
  selector: "app-children-list",
  template: `
    <app-entity-list
      [entityList]="childrenList"
      [listConfig]="listConfig"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
    ></app-entity-list>
  `,
})
export class ChildrenListComponent implements OnInit {
  childrenList: Child[] = [];
  listConfig: any = {};

  constructor(
    private childrenService: ChildrenService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.data.subscribe((config) => (this.listConfig = config));
    this.childrenService
      .getChildren()
      .subscribe((children) => (this.childrenList = children));
  }

  routeTo(route: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, route]);
  }
}
