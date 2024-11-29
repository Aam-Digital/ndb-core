import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { EditExternalProfileLinkComponent } from "./edit-external-profile-link.component";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FormControl } from "@angular/forms";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ExternalProfileLinkConfig } from "./external-profile-link-config";
import { SkillApiService } from "../skill-api.service";
import { delay, of } from "rxjs";
import { ExternalProfile } from "../external-profile";

const mockSkillApi = {
  getExternalProfiles: () =>
    of([createDummyData("1"), createDummyData("2")]).pipe(delay(1000)),
};

function createDummyData(externalId: string): ExternalProfile {
  return {
    id: externalId,
    fullName: "John Doe " + externalId,
    phone: "+1234567890",
    email: "john@example.com",
    skills: [
      {
        escoUri:
          "http://data.europa.eu/esco/skill/0ac31705-79ff-4409-a818-c9d0a6388e84",
        usage: "ALWAYS",
      },
      {
        escoUri:
          "http://data.europa.eu/esco/skill/2e040fb0-66b9-4529-bec6-466472b60773",
        usage: "OFTEN",
      },
    ],
    importedAt: "2021-01-01T00:00:00Z",
    latestSyncAt: "2021-01-01T00:00:00Z",
    updatedAtExternalSystem: "2021-01-01T00:00:00Z",
  };
}

const meta: Meta<EditExternalProfileLinkComponent> = {
  title: "Features/Skill Integration/EditExternalProfileLink",
  component: EditExternalProfileLinkComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
        { provide: SkillApiService, useValue: mockSkillApi },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<EditExternalProfileLinkComponent>;

export const FindProfile: Story = {
  args: {
    formControl: new FormControl(),
    entity: TestEntity.create({
      name: "John Doe",
      other: "john@example.com",
    }),
    additional: {
      searchFields: {
        fullName: ["name"],
        email: ["other"],
      },
    } as ExternalProfileLinkConfig,
  },
};

export const LinkedProfile: Story = {
  args: {
    formControl: new FormControl("123"),
    entity: new TestEntity(),
    additional: {
      searchFields: {
        name: ["name"],
        email: ["other"],
      },
    } as ExternalProfileLinkConfig,
  },
};
