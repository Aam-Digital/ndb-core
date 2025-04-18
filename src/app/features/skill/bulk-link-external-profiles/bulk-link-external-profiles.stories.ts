import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { BulkLinkExternalProfilesComponent } from "./bulk-link-external-profiles.component";
import { Entity } from "../../../core/entity/model/entity";
import { SkillApiService } from "../skill-api/skill-api.service";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ExternalProfileLinkConfig } from "../external-profile-link-config";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { NEVER, throwError } from "rxjs";
import { mockSkillApi } from "../skill-api/skill-api-mock";

const entities: Entity[] = [
  TestEntity.create({ name: "Test Entity 1" }),
  TestEntity.create({ name: "Test Entity 2" }),
  TestEntity.create({ name: "Test Entity 3" }),
];
entities[0]["ref"] = "1";

export default {
  title: "Features/Skill Integration/BulkLinkExternalProfiles",
  component: BulkLinkExternalProfilesComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
        {
          provide: SkillApiService,
          useValue: {
            generateDefaultSearchParams: () => ({}),
            getExternalProfiles: () => NEVER,
            getExternalProfileById: (x) => x,
          },
        },
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
  applyData: [],
};

export const Default: Story = {
  args: {
    entities: entities,
    config: { id: "ref", additional: profileLinkConfig } as FormFieldConfig,
    // @ts-ignore
    skillApi: mockSkillApi,
  },
};

export const Loading: Story = {
  args: {
    entities: entities,
    config: { id: "ref", additional: profileLinkConfig } as FormFieldConfig,
  },
};

export const Error: Story = {
  args: {
    entities: entities,
    config: { id: "ref", additional: profileLinkConfig } as FormFieldConfig,
    // @ts-ignore
    skillApi: {
      getExternalProfiles: () => throwError(() => "Test error"),
      generateDefaultSearchParams: () => ({}),
    },
  },
};
