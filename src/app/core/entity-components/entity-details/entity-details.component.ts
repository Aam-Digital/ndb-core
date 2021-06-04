import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  PanelConfig,
  EntityDetailsConfig,
  Panel,
  PanelComponent,
} from "./EntityDetailsConfig";
import { Entity, EntityConstructor } from "../../entity/entity";
import { School } from "../../../child-dev-project/schools/model/school";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { getUrlWithoutParams } from "../../../utils/utils";
import { Child } from "../../../child-dev-project/children/model/child";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import {
  EntityPermissionsService,
  OperationType,
} from "../../permissions/entity-permissions.service";
import { User } from "../../user/user";

export const ENTITY_MAP: Map<string, any> = new Map<
  string,
  EntityConstructor<Entity>
>([
  ["Child", Child],
  ["Participant", Child],
  ["School", School],
  ["Team", School],
  ["RecurringActivity", RecurringActivity],
  ["User", User],
]);

/**
 * This component can be used to display a entity in more detail.
 * It groups subcomponents in panels.
 * Any component can be used as a subcomponent.
 * The subcomponents will be provided with the Entity object and the creating new status, as well as its static config.
 */
@Component({
  selector: "app-entity-details",
  templateUrl: "./entity-details.component.html",
  styleUrls: ["./entity-details.component.scss"],
})
export class EntityDetailsComponent {
  entity: Entity;
  creatingNew = false;

  operationType = OperationType;

  panels: Panel[] = [];
  classNamesWithIcon: String;
  config: EntityDetailsConfig;

  constructor(
    private entityMapperService: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private snackBar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService,
    private permissionService: EntityPermissionsService
  ) {
    this.route.data.subscribe((config: EntityDetailsConfig) => {
      this.config = config;
      this.classNamesWithIcon = "fa fa-" + config.icon + " fa-fw";
      this.route.paramMap.subscribe((params) =>
        this.loadEntity(params.get("id"))
      );
    });
  }

  private loadEntity(id: string) {
    const constr: EntityConstructor<Entity> = ENTITY_MAP.get(
      this.config.entity
    );
    if (id === "new") {
      this.entity = new constr();
      if (
        !this.permissionService.userIsPermitted(
          this.entity.getConstructor(),
          this.operationType.CREATE
        )
      ) {
        this.router.navigate([""]);
      }
      this.creatingNew = true;
      this.setPanelsConfig();
    } else {
      this.creatingNew = false;
      this.entityMapperService.load<Entity>(constr, id).then((entity) => {
        this.entity = entity;
        this.setPanelsConfig();
      });
    }
  }

  private setPanelsConfig() {
    this.panels = this.config.panels.map((p) => {
      return {
        title: p.title,
        components: p.components.map((c) => {
          return {
            title: c.title,
            component: c.component,
            config: this.getPanelConfig(c),
          };
        }),
      };
    });
  }

  private getPanelConfig(c: PanelComponent): PanelConfig {
    return {
      entity: this.entity,
      config: c.config,
      creatingNew: this.creatingNew,
    };
  }

  removeEntity() {
    const dialogRef = this.confirmationDialog.openDialog(
      $localize`:Delete confirmation title:Delete?`,
      $localize`:Delete confirmation text:Are you sure you want to delete this ${this.config.entity} ?`
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      const currentUrl = getUrlWithoutParams(this.router);
      if (confirmed) {
        this.entityMapperService
          .remove<Entity>(this.entity)
          .then(() => this.navigateBack())
          .catch((err) => console.log("error", err));

        const snackBarRef = this.snackBar.open(
          $localize`:Deleted Entity information:Deleted Entity ${this.entity.getId()}`,
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
