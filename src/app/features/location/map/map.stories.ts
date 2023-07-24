import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { MapComponent } from "./map.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Location/Map",
  component: MapComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<MapComponent> = (args: MapComponent) => ({
  component: MapComponent,
  props: args,
});

export const Single = Template.bind({});
Single.args = {
  marked: [{ lat: 52.4790412, lon: 13.4319106 }],
};

export const Multiple = Template.bind({});
Multiple.args = {
  marked: [
    { lat: 52.4790412, lon: 13.4319106 },
    { lat: 52.4750412, lon: 13.4319106 },
  ],
  expandable: true,
};
