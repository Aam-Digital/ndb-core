import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FileTemplate } from "./file-template.entity";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { AdminOverviewService } from "../../core/admin/admin-overview/admin-overview.service";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class PdfGeneratorModule {
  static databaseEntities = [FileTemplate];

  constructor(
    components: ComponentRegistry,
    routerService: RouterService,
    adminOverviewService: AdminOverviewService,
    entityActionsMenuService: EntityActionsMenuService,
  ) {
    components.addAll(dynamicComponents);
    routerService.addRoutes(viewConfigs);

    entityActionsMenuService.registerActions([
      {
        action: "pdf",
        label: $localize`:entity context menu:Generate PDF`,
        icon: "print",
        tooltip: $localize`:entity context menu tooltip:Create a PDF file based on a selected file template.`,
        permission: "read",
        execute: async (e) => {
          alert("COMING SOON");
          return true;
        },
      },
    ]);

    adminOverviewService.menuItems.push({
      label: $localize`:admin menu item:PDF File Templates`,
      link: FileTemplate.route,
    });
  }
}

const dynamicComponents: [string, AsyncComponent][] = [];

const viewConfigs: ViewConfig[] = [
  // List View
  {
    _id: "view:" + FileTemplate.route,
    component: "EntityList",
    config: {
      entityType: FileTemplate.ENTITY_TYPE,
      columns: ["title", "description", "applicableForEntityTypes"],
      filters: [{ id: "applicableForEntityTypes" }],
    } as EntityListConfig,
  },

  // Details View
  {
    _id: "view:" + FileTemplate.route + "/:id",
    component: "EntityDetails",
    config: {
      entityType: FileTemplate.ENTITY_TYPE,
      panels: [
        {
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  { fields: ["title", "description", "templateId"] },
                  { fields: ["applicableForEntityTypes"] },
                ],
              },
            },
          ],
        },
      ],
    } as EntityDetailsConfig,
  },
];
