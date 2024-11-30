import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AsyncComponent, ComponentRegistry } from "../../dynamic-components";

/**
 * Integration with external Skill Tagging services via API.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class SkillModule {
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
