import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterService } from "../../core/config/dynamic-routing/router.service";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { AdminOverviewService } from "../../core/admin/admin-overview/admin-overview.service";
import { PublicFormConfig } from "./public-form-config";
import { AsyncComponent, ComponentRegistry } from "app/dynamic-components";
import { publicFormRoutes } from "./public-form-routing";
import { EntityActionsMenuService } from "app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { Entity } from "app/core/entity/model/entity";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";

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

  constructor(
    components: ComponentRegistry,
    routerService: RouterService,
    adminOverviewService: AdminOverviewService,
    entityActionsMenuService: EntityActionsMenuService,
    private alertService: AlertService,
    private entityMapper: EntityMapperService,
  ) {
    components.addAll(dynamicComponents);
    routerService.addRoutes(viewConfigs);
    adminOverviewService.menuItems.push({
      label: $localize`:admin menu item:Manage Public Forms`,
      link: PublicFormConfig.route,
    });
    this.initCustomFormActions(entityActionsMenuService);
  }
  /**
   * Initializes and registers custom form actions for entities.
   * - Loads all PublicFormConfig entries from the EntityMapper.
   * - Filters configs to those with a linkedEntity ID.
   * - For each matching config, registers a "copy-form-<route>" action that:
   *   • Executes copying a prebuilt form URL based on the config.
   *   • Is only visible when matching configs exist for the given entity.
   */
  private async initCustomFormActions(
    entityActionsMenuService: EntityActionsMenuService,
  ) {
    const allForms = await this.entityMapper.loadType(PublicFormConfig);
    const matchingForms = allForms.filter((config) => config.linkedEntity?.id);
    for (const config of matchingForms) {
      entityActionsMenuService.registerActions([
        {
          action: `copy-form-${config.route}`,
          execute: (entity) =>
            this.copyPublicFormLinkFromConfig(entity, config),
          permission: "read",
          icon: "link",
          label: `Copy Custom Form (${config.title})`,
          tooltip: `Copy a public form URL for ${config.title} that links this entity to the submission.`,
          visible: (entity) =>
            this.getMatchingPublicFormConfigs(config, entity),
        },
      ]);
    }
  }

  /**
   * Copies the public form link to clipboard if a matching form exists for the given entity.
   * It checks all PublicFormConfig entries to find the one linked to the current entity type via `linkedEntity.id`.
   * If a matching form is found, it generates the link including the entity ID as a query parameter and copies it.
   */

  public async copyPublicFormLinkFromConfig(
    entity: Entity,
    config: PublicFormConfig,
  ): Promise<boolean> {
    const paramKey = config.linkedEntity.id;
    const entityId = entity.getId();
    const fullUrl = `${window.location.origin}/public-form/form/${config.route}?${paramKey}=${encodeURIComponent(entityId)}`;

    await navigator.clipboard.writeText(fullUrl);
    this.alertService.addInfo("Link copied: " + fullUrl);
    return true;
  }

  public getMatchingPublicFormConfigs(
    config: PublicFormConfig,
    entity: Entity,
  ): Promise<boolean> {
    const entityType = entity.getConstructor().ENTITY_TYPE.toLowerCase();
    const linkedEntity = config.linkedEntity;

    if (!linkedEntity) return Promise.resolve(false);

    if (linkedEntity.additional) {
      return Promise.resolve(
        linkedEntity.additional.toLowerCase() === entityType,
      );
    }
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
    "EditRelatedEntitiesComponent",
    () =>
      import(
        "app/features/public-form/edit-related-entities/edit-related-entities.component"
      ).then((c) => c.EditRelatedEntitiesComponent),
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
                    fields: ["prefilledFields", "linkedEntity"],
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
