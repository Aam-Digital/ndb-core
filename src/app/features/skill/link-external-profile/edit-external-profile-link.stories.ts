import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { EditExternalProfileLinkComponent } from "./edit-external-profile-link.component";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FormControl } from "@angular/forms";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ExternalProfileLinkConfig } from "../external-profile-link-config";
import { SkillApiService } from "../skill-api.service";
import { mockSkillApi } from "../skill-api-mock";

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
      applyData: [],
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
      applyData: [],
    } as ExternalProfileLinkConfig,
  },
};

export const LinkedProfileNotFound: Story = {
  args: {
    formControl: new FormControl("123"),
    entity: new TestEntity(),
    additional: {
      searchFields: {
        name: ["name"],
        email: ["other"],
      },
      applyData: [],
    } as ExternalProfileLinkConfig,
    externalProfileError: true,
  },
};
