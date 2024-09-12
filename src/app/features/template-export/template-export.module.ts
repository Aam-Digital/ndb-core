import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { AdminOverviewService } from "../../core/admin/admin-overview/admin-overview.service";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { Entity } from "../../core/entity/model/entity";
import { TemplateExportFileDatatype } from "./template-export-file-datatype/template-export-file.datatype";
import { TemplateExport } from "./template-export.entity";
import { TemplateExportService } from "./template-export-service/template-export.service";

/**
 * Manage template files with placeholders that can be used to render files for export of entities.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    {
      provide: DefaultDatatype,
      useClass: TemplateExportFileDatatype,
      multi: true,
    },
  ],
})
export class TemplateExportModule {
  static databaseEntities = [TemplateExport];

  constructor(
    components: ComponentRegistry,
    routerService: RouterService,
    adminOverviewService: AdminOverviewService,
    entityActionsMenuService: EntityActionsMenuService,
    templateExportService: TemplateExportService,
  ) {
    components.addAll(dynamicComponents);
    routerService.addRoutes(viewConfigs);

    entityActionsMenuService.registerActions([
      {
        action: "template-export",
        label: $localize`:entity context menu:Generate File`,
        icon: "print",
        tooltip: $localize`:entity context menu tooltip:Create a file based on a selected template.`,
        permission: "read",
        execute: async (e: Entity) => templateExportService.generateFile(e),
      },
    ]);

    adminOverviewService.menuItems.push({
      label: $localize`:admin menu item:Manage Export Templates`,
      link: TemplateExport.route,
    });
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "EditTemplateExportFile",
    () =>
      import(
        "./template-export-file-datatype/edit-template-export-file.component"
      ).then((c) => c.EditTemplateExportFileComponent),
  ],
];

const viewConfigs: ViewConfig[] = [
  // List View
  {
    _id: "view:" + TemplateExport.route,
    component: "EntityList",
    config: {
      entityType: TemplateExport.ENTITY_TYPE,
      columns: ["title", "description", "applicableForEntityTypes"],
      filters: [{ id: "applicableForEntityTypes" }],
    } as EntityListConfig,
  },

  // Details View
  {
    _id: "view:" + TemplateExport.route + "/:id",
    component: "EntityDetails",
    config: {
      entityType: TemplateExport.ENTITY_TYPE,
      panels: [
        {
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  { fields: ["title", "description"] },
                  { fields: ["applicableForEntityTypes", "templateId"] },
                ],
              },
            },
          ],
        },
      ],
    } as EntityDetailsConfig,
  },
];
