import { applicationConfig, Meta, StoryFn, StoryObj } from "@storybook/angular";
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

export const Single: StoryObj<MapComponent> = {
  args: {
    marked: [{ lat: 52.4790412, lon: 13.4319106 }],
  },
};

export const Multiple: StoryObj<MapComponent> = {
  args: {
    marked: [
      { lat: 52.4790412, lon: 13.4319106 },
      { lat: 52.4750412, lon: 13.4319106 },
    ],
    expandable: true,
  },
};
