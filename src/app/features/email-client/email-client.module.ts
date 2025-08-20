import { NgModule, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { Entity } from "../../core/entity/model/entity";
import { EmailClientService } from "./email-client.service";

@NgModule({
  imports: [CommonModule],
})
export class EmailClientServicetModule {
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
      },
    ]);
  }
}
