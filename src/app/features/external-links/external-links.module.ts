import { inject, NgModule } from "@angular/core";
import { AsyncComponent, ComponentRegistry } from "app/dynamic-components";
import { AdminEntitySectionsService } from "../../core/admin/admin-entity/admin-entity-sections.service";
import { AdminOverviewService } from "../../core/admin/admin-overview/admin-overview.service";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { getEntityRuntimeRoute } from "../../core/entity/entity-config.service";
import { ExternalLinkConfig } from "./external-link-config";
import { ExternalLinksService } from "./external-links.service";

const SUMMARY = $localize`:ExternalLinkConfig:Link from a record to its entry in another system (e.g. a CRM or accounting tool), passing on values of the record in the web address.`;

/**
 * Links to external sites in the actions menu of a record, configured by admins per record type.
 */
@NgModule({})
export class ExternalLinksModule {
  static databaseEntities = [ExternalLinkConfig];

  constructor() {
    const externalLinksService = inject(ExternalLinksService);

    inject(ComponentRegistry).addAll(dynamicComponents);
    inject(RouterService).addRoutes(viewConfigs);
    inject(AdminOverviewService).addTemplateItems({
      label: ExternalLinkConfig.labelPlural,
      link: getEntityRuntimeRoute(ExternalLinkConfig),
      subtitle: SUMMARY,
    });
    inject(AdminEntitySectionsService).addSections({
      id: "externalLinks",
      label: ExternalLinkConfig.labelPlural,
      description: SUMMARY,
      entityType: ExternalLinkConfig.ENTITY_TYPE,
      property: "entity",
      columns: ["title", "url"],
    });
    inject(EntityActionsMenuService).registerActionsFactories([
      (entity) => externalLinksService.getActions(entity),
    ]);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "EditExternalLinkCondition",
    () =>
      import("./edit-external-link-condition/edit-external-link-condition.component").then(
        (c) => c.EditExternalLinkConditionComponent,
      ),
  ],
];

const viewConfigs: ViewConfig[] = [
  // List View
  {
    _id: "view:" + ExternalLinkConfig.route,
    component: "EntityList",
    config: {
      entityType: ExternalLinkConfig.ENTITY_TYPE,
      columns: ["title", "entity", "url"],
      filters: [{ id: "entity" }],
    } as EntityListConfig,
  },

  // Details View
  {
    _id: "view:" + ExternalLinkConfig.route + "/:id",
    component: "EntityDetails",
    config: {
      entityType: ExternalLinkConfig.ENTITY_TYPE,
      panels: [
        {
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: ["title", "entity", "condition"],
                  },
                  {
                    fields: [
                      "url",
                      {
                        id: "url_explanation",
                        viewComponent: "DisplayDescriptionOnly",
                        label: $localize`:ExternalLinkConfig:Use placeholders to pass on values of the record:

- **{d.name}** is replaced with the value in the "name" field of the record. The key must match the "Field ID" of the field (Edit Data Structure -> Details View -> edit a field).
- **{d.\_id}** is the unique ID of the record.
- **{d.school.name}** reads a field of a linked record.
- **{c.user.name}** reads a field of the record of the logged-in user.

These are the placeholders of the Export Templates, without their formatting options. If a placeholder refers to a field that does not exist, the link is not shown.

**The values become part of the web address**, which the other site receives and which is kept in the browser history. Only include what the other site needs.`,
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
