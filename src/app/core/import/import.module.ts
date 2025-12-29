import { NgModule, inject } from "@angular/core";
import { ComponentRegistry, ComponentTuple } from "../../dynamic-components";
import { DiscreteImportConfigComponent } from "../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component";
import { EntityActionsMenuService } from "../entity-details/entity-actions-menu/entity-actions-menu.service";
import { ImportAdditionalService } from "./additional-actions/import-additional.service";
import { EntityAction } from "../entity-details/entity-actions-menu/entity-action.interface";
import { Entity } from "../entity/model/entity";
import { Router } from "@angular/router";

/**
 * UI enabling users to import data from spreadsheets through a guided workflow.
 */
@NgModule({
  imports: [DiscreteImportConfigComponent],
})
export class ImportModule {
  private importAdditionalService = inject(ImportAdditionalService);
  private router = inject(Router);

  constructor() {
    const components = inject(ComponentRegistry);
    const entityActionsMenu = inject(EntityActionsMenuService);

    components.addAll(importComponents);

    entityActionsMenu.registerActionsFactories([
      (e) => this.getAdditionalImportActionsForTargetEntity(e),
    ]);
  }

  getAdditionalImportActionsForTargetEntity(entity?: Entity): EntityAction[] {
    if (!entity) {
      return [];
    }

    const actions: EntityAction[] = [];
    const importActions = this.importAdditionalService
      .getActionsLinkingTo(entity.getType())
      .map((a) => ({ ...a, targetId: entity.getId() }))
      .filter((a) => !a.expertOnly); // hide advanced actions for simplicity

    for (const importAction of importActions) {
      actions.push({
        action: JSON.stringify(importAction),
        label: this.importAdditionalService.createActionLabel(
          importAction,
          true,
        ),
        icon: "file-import",
        execute: () =>
          this.router.navigate(["import"], {
            queryParams: {
              entityType: importAction.sourceType,
              additionalAction: JSON.stringify(importAction),
            },
          }),
        availableFor: "all",
      });
    }

    return actions;
  }
}

const importComponents: ComponentTuple[] = [
  [
    "Import",
    () => import("./import/import.component").then((c) => c.ImportComponent),
  ],
  [
    "DiscreteImportConfig",
    () =>
      import("../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component").then(
        (c) => c.DiscreteImportConfigComponent,
      ),
  ],
  [
    "DateImportConfig",
    () =>
      import("../basic-datatypes/date/date-import-config/date-import-config.component").then(
        (c) => c.DateImportConfigComponent,
      ),
  ],
  [
    "EntityImportConfig",
    () =>
      import("../basic-datatypes/entity/entity-import-config/entity-import-config.component").then(
        (c) => c.EntityImportConfigComponent,
      ),
  ],
];
