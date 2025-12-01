import { inject, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { Skill } from "./skill";
import { SkillApiService } from "./skill-api/skill-api.service";
import { environment } from "../../../environments/environment";
import { mockSkillApi } from "./skill-api/skill-api-mock";
import { EntityActionsMenuService } from "#src/app/core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "#src/app/core/entity/model/entity";
import { BulkLinkExternalProfilesComponent } from "#src/app/features/skill/bulk-link-external-profiles/bulk-link-external-profiles.component";

/**
 * Integration with external Skill Tagging services via API.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    {
      provide: SkillApiService,
      useFactory: () => {
        if (environment.demo_mode) {
          return mockSkillApi;
        } else {
          return new SkillApiService();
        }
      },
    },
  ],
})
export class SkillModule {
  static databaseEntities = [Skill];

  components = inject(ComponentRegistry);
  entityActionsMenuService = inject(EntityActionsMenuService);
  dialog = inject(MatDialog);
  skillApi = inject(SkillApiService);

  constructor() {
    this.components.addAll(dynamicComponents);
    this.registerEntityActions();
  }

  private registerEntityActions() {
    this.entityActionsMenuService.registerActions([
      {
        action: "bulk-link-external-profile",
        label: $localize`:entity context menu:Link External Profile`,
        icon: "link",
        tooltip: $localize`:entity context menu tooltip:Link multiple records to external profiles in bulk.`,
        availableFor: "bulk-only",
        permission: "update",
        visible: async () => await this.skillApi.isSkillApiEnabled(),
        execute: async (entity: Entity) => {
          const entities = Array.isArray(entity) ? entity : [entity];
          if (!entities.length) return false;
          this.dialog.open(BulkLinkExternalProfilesComponent, {
            maxHeight: "90vh",
            data: { entities },
          });
          return true;
        },
      },
    ]);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "EditExternalProfileLink",
    () =>
      import("./link-external-profile/edit-external-profile-link.component").then(
        (c) => c.EditExternalProfileLinkComponent,
      ),
  ],
  [
    "BulkLinkExternalProfiles",
    () =>
      import("./bulk-link-external-profiles/bulk-link-external-profiles.component").then(
        (c) => c.BulkLinkExternalProfilesComponent,
      ),
  ],
];
