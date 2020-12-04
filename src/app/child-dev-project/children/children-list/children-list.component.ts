import { Component, OnInit } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ChildrenService } from "../children.service";

@UntilDestroy()
@Component({
  selector: "app-children-list",
  template: ` <app-entity-list
    [entityList]="childrenList"
    [listConfig]="listConfig"
  ></app-entity-list>`,
})
export class ChildrenListComponent implements OnInit {
  childrenList: Child[] = [];
  listConfig: any = {};

  constructor(
    private childrenService: ChildrenService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.data.subscribe((config) => {
      this.listConfig = config;
    });
    this.childrenService.getChildren().subscribe((children) => {
      this.childrenList = children;
    });
  }
}
