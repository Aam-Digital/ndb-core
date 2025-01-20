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
    "EditPublicFormColumns",
    () =>
      import(
        "app/features/public-form/edit-public-form-columns/edit-public-form-columns.component"
      ).then((c) => c.EditPublicFormColumnsComponent),
  ],
  [
    "EditPrefilledValuesComponent",
    () =>
      import(
        "app/features/public-form/edit-prefilled-values/edit-prefilled-values.component"
      ).then((c) => c.EditPrefilledValuesComponent),
  ],
  [
    "EditPublicformRouteComponent",
    () =>
      import(
        "app/features/public-form/edit-publicform-route/edit-publicform-route.component"
      ).then((c) => c.EditPublicformRouteComponent),
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
          title: $localize`:PublicFormConfig admin form panel:General Setting`,
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: [
                      {
                        id: "route",
                        editComponent: "EditPublicformRouteComponent",
                      },
                      "title",
                    ],
                  },
                  {
                    fields: [
                      {
                        id: "permissions_remark",
                        editComponent: "EditDescriptionOnly",
                        label: $localize`:PublicFormConfig admin form:If you want external people filling this form without logging in, the _Permission System_ also has to allow **"public"** users to create new records of this type.<br> 
                        If you are seeing problems submitting the form, please contact your **technical support team**.`,
                      },
                      "entity",
                      "description",
                      "logo",
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          title: $localize`:PublicFormConfig admin form panel:Configure Fields`,
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: [
                      {
                        id: "columns",
                        editComponent: "EditPublicFormColumns",
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          title: $localize`:PublicFormConfig admin form panel:Configure Default/Pre-filled Values`,
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: [
                      {
                        id: "restrictedPrefilled",
                        editComponent: "EditPrefilledValuesComponent",
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
