import { inject, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { Entity } from "../../core/entity/model/entity";
import { EmailClientService } from "./email-client.service";
import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";
import { AdminOverviewService } from "#src/app/core/admin/admin-overview/admin-overview.service";
import { EmailTemplate } from "./email-template.entity";
import { RouterService } from "#src/app/core/config/dynamic-routing/router.service";
import { EntityDetailsConfig } from "#src/app/core/entity-details/EntityDetailsConfig";
import { ViewConfig } from "#src/app/core/config/dynamic-routing/view-config.interface";
import { EntityListConfig } from "#src/app/core/entity-list/EntityListConfig";
import { asArray } from "#src/app/utils/asArray";

@NgModule({
  imports: [CommonModule],
})
export class EmailClientServiceModule {
  constructor() {
    const entityActionsMenuService = inject(EntityActionsMenuService);
    const emailClientService = inject(EmailClientService);
    const adminOverviewService = inject(AdminOverviewService);
    const routerService = inject(RouterService);

    routerService.addRoutes(viewConfigs);

    entityActionsMenuService.registerActions([
      {
        action: "send-email",
        label: $localize`:entity context menu:Send Email`,
        icon: "envelope",
        permission: "read",
        execute: async (e: Entity) => emailClientService.executeMailto(e),
        visible: async (entity) => {
          entity = asArray(entity)[0]; // assuming all entities have same type
          if (!entity) {
            return false;
          }

          // Only show if there is at least one email field in the schema
          const schema = entity.getConstructor().schema;
          for (const [, field] of schema.entries()) {
            if (field.dataType === EmailDatatype.dataType) {
              return true;
            }
          }
          return false;
        },
        availableFor: "all",
      },
    ]);

    adminOverviewService.addTemplateItems({
      label: $localize`:admin menu item:Email Templates`,
      link: EmailTemplate.route,
      subtitle: $localize`:admin menu item subtitle:Configure templates for sending emails, populated with the template's subject and body text.`,
    });
  }
}

const viewConfigs: ViewConfig[] = [
  {
    _id: "view:" + EmailTemplate.route,
    component: "EntityList",
    config: {
      entityType: EmailTemplate.ENTITY_TYPE,
      columns: ["subject", "body", "availableForEntityTypes", "category"],
    } as EntityListConfig,
  },

  // Details View
  {
    _id: "view:" + EmailTemplate.route + "/:id",
    component: "EntityDetails",
    config: {
      entityType: EmailTemplate.ENTITY_TYPE,
      panels: [
        {
          components: [
            {
              component: "Form",
              config: {
                fieldGroups: [
                  {
                    fields: ["subject", "body"],
                  },
                  {
                    fields: ["availableForEntityTypes", "category"],
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
