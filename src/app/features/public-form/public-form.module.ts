import { NgModule, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { AdminOverviewService } from "../../core/admin/admin-overview/admin-overview.service";
import { PublicFormConfig } from "./public-form-config";
import { AsyncComponent, ComponentRegistry } from "app/dynamic-components";
import { publicFormRoutes } from "./public-form-routing";
import { PublicFormsService } from "./public-forms.service";

/**
 * Configure publicly accessible forms for users without login to record some data into the system.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class PublicFormModule {
  static databaseEntities = [PublicFormConfig];
  static routes = publicFormRoutes;

  constructor() {
    const components = inject(ComponentRegistry);
    const routerService = inject(RouterService);
    const adminOverviewService = inject(AdminOverviewService);
    const publicFormsService = inject(PublicFormsService);

    components.addAll(dynamicComponents);
    routerService.addRoutes(viewConfigs);
    adminOverviewService.menuItems.push({
      label: $localize`:admin menu item:Configure Public Forms`,
      link: PublicFormConfig.route,
    });
    publicFormsService.initCustomFormActions();
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
    "EditPublicformRoute",
    () =>
      import(
        "app/features/public-form/edit-publicform-route/edit-publicform-route.component"
      ).then((c) => c.EditPublicformRouteComponent),
  ],
  [
    "EditPublicFormRelatedEntitiesComponent",
    () =>
      import(
        "app/features/public-form/edit-public-form-related-entities/edit-public-form-related-entities.component"
      ).then((c) => c.EditPublicFormRelatedEntitiesComponent),
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
                    fields: ["route", "title", "description"],
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
                    fields: ["columns"],
                  },
                ],
              },
            },
          ],
        },
        {
          title: $localize`:PublicFormConfig admin form panel:Configure Pre-filled Values`,
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: ["prefilled", "linkedEntity", "linkedEntities"],
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
