import { NgModule } from "@angular/core";
import { ComponentRegistry, ComponentTuple } from "../../dynamic-components";
import { DiscreteImportConfigComponent } from "../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component";
import { EntityActionsMenuService } from "../entity-details/entity-actions-menu/entity-actions-menu.service";
import { ImportAdditionalService } from "./additional-actions/import-additional.service";
import { EntityAction } from "../entity-details/entity-actions-menu/entity-action.interface";
import { Entity } from "../entity/model/entity";
import { Router } from "@angular/router";
import { EntityTypeLabelPipe } from "../common-components/entity-type-label/entity-type-label.pipe";
import {
  AdditionalIndirectLinkAction,
  AdditonalDirectLinkAction,
} from "./additional-actions/additional-import-action";

/**
 * UI enabling users to import data from spreadsheets through a guided workflow.
 */
@NgModule({
  imports: [DiscreteImportConfigComponent],
  providers: [EntityTypeLabelPipe],
})
export class ImportModule {
  constructor(
    components: ComponentRegistry,
    entityActionsMenu: EntityActionsMenuService,
    private importAdditionalService: ImportAdditionalService,
    private router: Router,
    private entityTypeLabelPipe: EntityTypeLabelPipe,
  ) {
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
      .map((a) => ({ ...a, targetId: entity.getId() }));

    for (const importAction of importActions) {
      let label: string = $localize`Import related ${this.entityTypeLabelPipe.transform(importAction.sourceType, true)} for this ${entity.getConstructor().label}`;
      if (
        importActions.filter((a) => a.sourceType === importAction.sourceType)
          .length > 1
      ) {
        // there are multiple imports for the same source type, so we need to distinguish them with additional info:
        label += ` (${(importAction as AdditonalDirectLinkAction).targetProperty ?? this.entityTypeLabelPipe.transform((importAction as AdditionalIndirectLinkAction).relationshipEntityType)})`;
      }

      actions.push({
        action: "import_related",
        label: label,
        icon: "file-import",
        execute: () =>
          this.router.navigate(["import"], {
            queryParams: {
              entityType: importAction.sourceType,
              additionalAction: JSON.stringify(importAction),
            },
          }),
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
      import(
        "../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component"
      ).then((c) => c.DiscreteImportConfigComponent),
  ],
  [
    "DateImportConfig",
    () =>
      import(
        "../basic-datatypes/date/date-import-config/date-import-config.component"
      ).then((c) => c.DateImportConfigComponent),
  ],
  [
    "EntityImportConfig",
    () =>
      import(
        "../basic-datatypes/entity/entity-import-config/entity-import-config.component"
      ).then((c) => c.EntityImportConfigComponent),
  ],
];
