import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FileTemplate } from "./file-template.entity";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class PdfGeneratorModule {
  static databaseEntities = [FileTemplate];

  constructor(components: ComponentRegistry, routerService: RouterService) {
    components.addAll(dynamicComponents);
    routerService.addRoutes(viewConfigs);
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
