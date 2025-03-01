import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";
import { Skill } from "./skill";
import { SkillApiService } from "./skill-api/skill-api.service";
import { environment } from "../../../environments/environment";
import { mockSkillApi } from "./skill-api/skill-api-mock";

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

  constructor(components: ComponentRegistry) {
    components.addAll(dynamicComponents);
  }
}

const dynamicComponents: [string, AsyncComponent][] = [
  [
    "EditExternalProfileLink",
    () =>
      import(
        "./link-external-profile/edit-external-profile-link.component"
      ).then((c) => c.EditExternalProfileLinkComponent),
  ],
  [
    "BulkLinkExternalProfiles",
    () =>
      import(
        "./bulk-link-external-profiles/bulk-link-external-profiles.component"
      ).then((c) => c.BulkLinkExternalProfilesComponent),
  ],
];
