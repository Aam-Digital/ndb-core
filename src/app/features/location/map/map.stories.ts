import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { LocationModule } from "../location.module";
import { MapComponent } from "./map.component";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";

export default {
  title: "Features/Location/Map",
  component: MapComponent,
  decorators: [
    moduleMetadata({
      imports: [LocationModule, StorybookBaseModule],
      providers: [EntitySchemaService],
    }),
  ],
} as Meta;

const Template: Story<MapComponent> = (args: MapComponent) => ({
  component: MapComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
