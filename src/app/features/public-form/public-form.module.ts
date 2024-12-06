import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { AdminOverviewService } from "../../core/admin/admin-overview/admin-overview.service";
import { PublicFormConfig } from "./public-form-config";
import { AsyncComponent, ComponentRegistry } from "app/dynamic-components";

/**
 * Configure publicly accessible forms for users without login to record some data into the system.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class PublicFormModule {
  static databaseEntities = [PublicFormConfig];

  constructor(
    components: ComponentRegistry,
    routerService: RouterService,
    adminOverviewService: AdminOverviewService,
  ) {
    components.addAll(dynamicComponents);
    routerService.addRoutes(viewConfigs);
    adminOverviewService.menuItems.push({
      label: $localize`:admin menu item:Manage Public Forms`,
      link: PublicFormConfig.route,
    });
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "EditPublicFormField",
    () =>
      import(
        "app/features/public-form/edit-public-form-field/edit-public-form-field.component"
      ).then((c) => c.EditPublicFormFieldComponent),
  ],
];

const viewConfigs: ViewConfig[] = [
  // List View
  {
    _id: "view:" + PublicFormConfig.route,
    component: "EntityList",
    config: {
      entityType: PublicFormConfig.ENTITY_TYPE,
      columns: ["title", "description", "entity"],
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
          title: "General Setting",
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: ["logo"],
                  },
                  {
                    fields: ["route", "title"],
                  },
                  {
                    fields: ["description", "entity"],
                  },
                ],
              },
            },
          ],
        },
        {
          title: "Configure Fields",
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: [
                      {
                        id: "columns",
                        editComponent: "EditPublicFormField",
                        dynamicComponentInput: {
                          entity: PublicFormConfig.ENTITY_TYPE,
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    } as EntityDetailsConfig,
  },
];
