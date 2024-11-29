import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { EditExternalProfileLinkComponent } from "./edit-external-profile-link.component";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FormControl } from "@angular/forms";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

const meta: Meta<EditExternalProfileLinkComponent> = {
  title: "Features/Skill Integration/EditExternalProfileLink",
  component: EditExternalProfileLinkComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
};

export default meta;
type Story = StoryObj<EditExternalProfileLinkComponent>;

export const FindProfile: Story = {
  args: {
    formControl: new FormControl(),
  },
};

export const LinkedProfile: Story = {
  args: {
    formControl: new FormControl("123"),
    entity: new TestEntity(),
  },
};
