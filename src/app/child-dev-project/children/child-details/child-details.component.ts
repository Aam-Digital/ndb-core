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
import { ChildrenService } from "../children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DynamicComponentConfig } from "../../../core/view/dynamic-components/dynamic-component-config.interface";

@UntilDestroy()
@Component({
  selector: "app-child-details",
  templateUrl: "./child-details.component.html",
  styleUrls: ["./child-details.component.scss"],
})
export class ChildDetailsComponent {
  child: Child = new Child("");
  creatingNew = false;

  panels: any[];

  constructor(
    private entityMapperService: EntityMapperService,
    private childrenService: ChildrenService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private snackBar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService
  ) {
    this.route.paramMap.subscribe((params) => this.loadChild(params.get("id")));
  }

  loadChild(id: string) {
    if (id === "new") {
      this.child = new Child(uniqid());
      this.creatingNew = true;
      this.addChildToConfig();
    } else {
      this.creatingNew = false;
      this.childrenService
        .getChild(id)
        .pipe(untilDestroyed(this))
        .subscribe((child) => {
          this.child = child;
          this.addChildToConfig();
        });
    }
  }

  private addChildToConfig() {
    this.route.data.subscribe((config) => {
      this.panels = config.panels.map((p) => {
        return {
          title: p.title,
          components: p.components.map((c) => {
            return {
              title: c.title,
              component: c.component,
              config: { child: this.child, config: c.config },
            };
          }),
        };
      });
    });
  }

  getConfig(componentConfig: any): DynamicComponentConfig {
    return {
      component: componentConfig.component,
      config: { child: this.child },
    };
  }

  removeChild() {
    const dialogRef = this.confirmationDialog.openDialog(
      "Delete?",
      "Are you sure you want to delete this Child?"
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.entityMapperService
          .remove<Child>(this.child)
          .then(() => this.router.navigate(["/child"]));

        const snackBarRef = this.snackBar.open(
          'Deleted Child "' + this.child.name + '"',
          "Undo",
          { duration: 8000 }
        );
        snackBarRef.onAction().subscribe(() => {
          this.entityMapperService.save(this.child, true);
          this.router.navigate(["/child", this.child.getId()]);
        });
      }
    });
  }

  navigateBack() {
    this.location.back();
  }
}
