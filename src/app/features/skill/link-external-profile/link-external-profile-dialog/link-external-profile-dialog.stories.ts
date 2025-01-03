import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { LinkExternalProfileDialogComponent } from "./link-external-profile-dialog.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { createSkillApiDummyData } from "../../skill-api/skill-api-mock";
import { SkillApiService } from "../../skill-api/skill-api.service";

const meta: Meta<LinkExternalProfileDialogComponent> = {
  title: "Features/Skill Integration/LinkExternalProfileDialog",
  component: LinkExternalProfileDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: SkillApiService, useValue: {} },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<LinkExternalProfileDialogComponent>;

export const Results: Story = {
  args: {
    possibleMatches: [
      createSkillApiDummyData("1"),
      createSkillApiDummyData("2"),
    ],
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: {},
    searchResult: undefined,
  },
};
