import { NgModule, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { Entity } from "../../core/entity/model/entity";
import { EmailClientService } from "./email-client.service";
import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";

@NgModule({
  imports: [CommonModule],
})
export class EmailClientServiceModule {
  constructor() {
    const entityActionsMenuService = inject(EntityActionsMenuService);
    const emailClientService = inject(EmailClientService);
    entityActionsMenuService.registerActions([
      {
        action: "send-email",
        label: $localize`:entity context menu:Send Email`,
        icon: "envelope",
        permission: "read",
        execute: async (e: Entity) =>
          emailClientService.executeMailtoFromEntity(e),
        visible: async (entity) => {
          // Only show if there is at least one email field in the schema
          const schema = entity.getConstructor().schema;
          for (const [, field] of schema.entries()) {
            if (field.dataType === EmailDatatype.dataType) {
              return true;
            }
          }
          return false;
        },
      },
    ]);
  }
}
