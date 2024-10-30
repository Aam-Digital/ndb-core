import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";
import { EditUrlComponent } from "./edit-url.component";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "app/utils/storybook-base.module";

const formFieldStory = generateFormFieldStory(
  "EditUrl",
  "https://github.com/Aam-Digital/ndb-core/issues/2460",
);

export default {
  title: "Core/Entities/Properties/url/EditUrl",
  component: EditUrlComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<EditUrlComponent> = (args: EditUrlComponent) => ({
  props: args,
});

export const Primary = {
  render: Template,
  args: {
    label: "URL",
    formControl: new FormControl(
      "https://github.com/Aam-Digital/ndb-core/issues/2460",
    ),
  },
};
export const DisabledWithClickableLink = {
  render: Template,
  args: {
    label: "URL",
    formControl: new FormControl({
      value: "https://github.com/Aam-Digital/ndb-core/issues/2460",
      disabled: true,
    }),
  },
};
export const InvalidUrl = {
  render: Template,
  args: {
    label: "URL",
    formControl: new FormControl("invalid-url"),
  },
};
