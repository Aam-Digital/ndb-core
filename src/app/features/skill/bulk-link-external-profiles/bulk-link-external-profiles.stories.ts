import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { BulkLinkExternalProfilesComponent } from "./bulk-link-external-profiles.component";
import { Entity } from "../../../core/entity/model/entity";
import { SkillApiService } from "../skill-api.service";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { mockSkillApi } from "../skill-api-mock";
import { ExternalProfileLinkConfig } from "../link-external-profile/external-profile-link-config";

const entities: Entity[] = [
  TestEntity.create({ name: "Test Entity 1" }),
  TestEntity.create({ name: "Test Entity 2" }),
  TestEntity.create({ name: "Test Entity 3" }),
];

export default {
  title: "Features/Skill Integration/BulkLinkExternalProfiles",
  component: BulkLinkExternalProfilesComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
        { provide: SkillApiService, useValue: mockSkillApi },
        // importProvidersFrom(StorybookBaseModule.withData([...entities])),
      ],
    }),
  ],
} as Meta<BulkLinkExternalProfilesComponent>;

type Story = StoryObj<BulkLinkExternalProfilesComponent>;

const profileLinkConfig: ExternalProfileLinkConfig = {
  searchFields: {
    fullName: ["name"],
    email: ["other"],
  },
};

export const Default: Story = {
  args: {
    entities: entities,
    config: profileLinkConfig,
  },
};
