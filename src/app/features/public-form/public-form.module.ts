import { CommonModule } from "@angular/common";
import { inject, NgModule } from "@angular/core";
import { AsyncComponent, ComponentRegistry } from "app/dynamic-components";
import { AdminOverviewService } from "../../core/admin/admin-overview/admin-overview.service";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { PublicFormConfig } from "./public-form-config";
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
    adminOverviewService.addTemplateItems({
      label: $localize`:admin menu item:Public Forms`,
      link: PublicFormConfig.route,
      subtitle: $localize`:admin menu item subtitle:Configure public forms shareable via link or website, to collect data even without a user account.`,
    });
    publicFormsService.initCustomFormActions();
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "EditPublicFormColumns",
    () =>
      import("app/features/public-form/edit-public-form-columns/edit-public-form-columns.component").then(
        (c) => c.EditPublicFormColumnsComponent,
      ),
  ],
  [
    "EditPrefilledValuesComponent",
    () =>
      import("app/features/public-form/edit-prefilled-values/edit-prefilled-values.component").then(
        (c) => c.EditPrefilledValuesComponent,
      ),
  ],
  [
    "EditPublicformRoute",
    () =>
      import("app/features/public-form/edit-publicform-route/edit-publicform-route.component").then(
        (c) => c.EditPublicformRouteComponent,
      ),
  ],
  [
    "EditPublicFormRelatedEntitiesComponent",
    () =>
      import("app/features/public-form/edit-public-form-related-entities/edit-public-form-related-entities.component").then(
        (c) => c.EditPublicFormRelatedEntitiesComponent,
      ),
  ],
  [
    "PublicFormPermissionWarning",
    () =>
      import("app/features/public-form/public-form-permission-warning/public-form-permission-warning.component").then(
        (c) => c.PublicFormPermissionWarningComponent,
      ),
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
                        viewComponent: "DisplayDescriptionOnly",
                        label: $localize`:PublicFormConfig admin form:If you want external people filling this form without logging in, the _Permission System_ also has to allow **"public"** users to create new records of this type.<br>
                        If you are seeing problems submitting the form, please contact your **technical support team**.`,
                      },
                      "entity",
                      {
                        id: "public_form_permission_warning",
                        viewComponent: "PublicFormPermissionWarning",
                      },
                      "logo",
                      "showSubmitAnotherButton",
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
                    fields: [
                      {
                        id: "prefilled_description",
                        viewComponent: "DisplayDescriptionOnly",
                        label: $localize`:PublicFormConfig admin form:You can configure some fields to be always be set to a certain value when this form is submitted. For example, make a "status" field always be set to "new" so that you can easily filter the new records submitted by external users; or make a "signed up on" date field to always show the current date. If you add the same field(s) in the "Configure Fields" section to show to the user, this pre-filled value can be changed by the person filling the form.`,
                      },
                      "prefilled",
                      {
                        id: "linked_entities_description",
                        viewComponent: "DisplayDescriptionOnly",
                        label: $localize`:PublicFormConfig admin form:**Collect replies of this form linked to individual records**<br> <br>You can use forms with a special "magic link" to collect responses from participants that are already registered in your system. By sending out an individual link to each person, the form response(s) from that person can be linked into their profile. For example, you can collect feedback or an evaluation survey and relate each submission to the specific participant or organisation that gave it.<br>The system supports linking to multiple entity types. For example, you can encode IDs of a person and activity in the magic link to collect feedback for that specific context. To set this up, select multiple fields below. Currently, such multi-ID URLs need to be generated outside of this system, however.`,
                      },
                      "linkedEntities",
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
