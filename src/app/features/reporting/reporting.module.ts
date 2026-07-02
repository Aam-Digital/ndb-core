import { inject, NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { reportingComponents } from "./reporting-components";
import { ReportEntity } from "./report-config";
import { RouterService } from "#src/app/core/config/dynamic-routing/router.service";
import { AdminOverviewService } from "#src/app/core/admin/admin-overview/admin-overview.service";
import { getEntityRuntimeRoute } from "#src/app/core/entity/entity-config.service";
import { ViewConfig } from "#src/app/core/config/dynamic-routing/view-config.interface";
import { EntityListConfig } from "#src/app/core/entity-list/EntityListConfig";
import { EntityDetailsConfig } from "#src/app/core/entity-details/EntityDetailsConfig";

@NgModule({})
export class ReportingModule {
  static readonly databaseEntities = [ReportEntity];

  constructor() {
    const components = inject(ComponentRegistry);
    const routerService = inject(RouterService);
    const adminOverviewService = inject(AdminOverviewService);

    components.addAll(reportingComponents);
    routerService.addRoutes(reportAdminViewConfigs);

    adminOverviewService.addTemplateItems({
      label: $localize`:admin menu item:Reports`,
      link: getEntityRuntimeRoute(ReportEntity),
      subtitle: $localize`:admin menu item subtitle:Create and edit report configurations for aggregations, exports and SQL reports.`,
    });
  }
}

/**
 * Admin list + details views to manage {@link ReportEntity} configs,
 * registered the same way as other "Templates and Forms" entities (e.g. EmailTemplate).
 */
const reportAdminViewConfigs: ViewConfig[] = [
  {
    _id: "view:" + ReportEntity.route,
    component: "EntityList",
    config: {
      entityType: ReportEntity.ENTITY_TYPE,
      columns: ["title", "mode", "description"],
    } as EntityListConfig,
  },

  // Details / edit view
  {
    _id: "view:" + ReportEntity.route + "/:id",
    component: "EntityDetails",
    config: {
      entityType: ReportEntity.ENTITY_TYPE,
      panels: [
        {
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: ["title", "mode", "description", "transformations"],
                  },
                  { fields: ["reportDefinition", "aggregationDefinitions"] },
                ],
              },
            },
          ],
        },
      ],
    } as EntityDetailsConfig,
  },
];
