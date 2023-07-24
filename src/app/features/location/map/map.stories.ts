import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { MapComponent } from "./map.component";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";

export default {
  title: "Features/Location/Map",
  component: MapComponent,
  decorators: [
    moduleMetadata({
      imports: [MapComponent, StorybookBaseModule],
      providers: [EntitySchemaService],
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
