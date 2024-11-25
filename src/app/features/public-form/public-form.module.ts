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
import { TemplateExportFileDatatype } from "../template-export/template-export-file-datatype/template-export-file.datatype";
import { PublicFormConfig } from "./public-form-config";

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
export class PubliFormModule {
  static databaseEntities = [PublicFormConfig];

  constructor(
    components: ComponentRegistry,
    routerService: RouterService,
    adminOverviewService: AdminOverviewService,
    entityActionsMenuService: EntityActionsMenuService,
  ) {
    routerService.addRoutes(viewConfigs);
    console.log(PublicFormConfig.ENTITY_TYPE,"PublicFormConfig.ENTITY_TYPE")


    adminOverviewService.menuItems.push({
      label: $localize`:admin menu item:Manage Public forms`,
      link: PublicFormConfig.route,
    });
  }
}


const viewConfigs: ViewConfig[] = [
  // List View
  {
    
    _id: "view:" + PublicFormConfig.route,
    component: "EntityList",
    config: {
      entityType: PublicFormConfig.ENTITY_TYPE,
      columns: ["title", "description", "entity", "columns"],
      filters: [{ id: "entity" }],
    } as EntityListConfig,
  },

  // Details View
  {
    _id: "view:" + PublicFormConfig.route + "/:id",
    component: "EntityDetails",
    config: {
      entityType: PublicFormConfig.ENTITY_TYPE,
      panels: [
        {
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: [
                      "title",
                      "description",
                      "entity",
                      "columns"
                    ],
                  }
                ],
              },
            },
          ],
        },
      ],
    } as EntityDetailsConfig,
  },
];
