/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component } from "@angular/core";
import { Child } from "../model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Location } from "@angular/common";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import * as uniqid from "uniqid";
import { UntilDestroy } from "@ngneat/until-destroy";
import { School } from "../../schools/model/school";
import { Entity, EntityConstructor } from "../../../core/entity/entity";

const ENTITY_MAP: Map<string, any> = new Map<string, EntityConstructor<Entity>>(
  [
    ["Child", Child],
    ["School", School],
  ]
);

@UntilDestroy()
@Component({
  selector: "app-child-details",
  templateUrl: "./child-details.component.html",
  styleUrls: ["./child-details.component.scss"],
})
export class ChildDetailsComponent {
  entity: Entity;
  creatingNew = false;

  panels: any[];
  classNamesWithIcon: String;
  config: any = {};

  constructor(
    private entityMapperService: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private snackBar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService
  ) {
    this.route.data.subscribe((config) => {
      this.config = config;
      this.classNamesWithIcon = "fa fa-" + config.icon + " fa-fw";
      this.route.paramMap.subscribe((params) =>
        this.loadEntity(params.get("id"))
      );
    });
  }

  loadEntity(id: string) {
    const constr: EntityConstructor<Entity> = ENTITY_MAP.get(
      this.config.entity
    );
    if (id === "new") {
      this.entity = new constr(uniqid());
      this.creatingNew = true;
      this.addEntityToConfig();
    } else {
      this.creatingNew = false;
      this.entityMapperService.load<Entity>(constr, id).then((entity) => {
        this.entity = entity;
        this.addEntityToConfig();
      });
    }
  }

  private addEntityToConfig() {
    this.panels = this.config.panels.map((p) => {
      return {
        title: p.title,
        components: p.components.map((c) => {
          return {
            title: c.title,
            component: c.component,
            config: {
              entity: this.entity,
              config: c.config,
              creatingNew: this.creatingNew,
            },
          };
        }),
      };
    });
  }

  removeEntity() {
    const dialogRef = this.confirmationDialog.openDialog(
      "Delete?",
      "Are you sure you want to delete this " + this.config.entity + " ?"
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      const currentUrl = this.router.url;
      if (confirmed) {
        this.entityMapperService
          .remove<Entity>(this.entity)
          .then(() => this.navigateBack())
          .catch((err) => console.log("error", err));

        const snackBarRef = this.snackBar.open(
          'Deleted Entity "' + this.entity.getId() + '"',
          "Undo",
          { duration: 8000 }
        );
        snackBarRef.onAction().subscribe(() => {
          this.entityMapperService.save(this.entity, true);
          this.router.navigate([currentUrl]);
        });
      }
    });
  }

  navigateBack() {
    this.location.back();
  }
}
