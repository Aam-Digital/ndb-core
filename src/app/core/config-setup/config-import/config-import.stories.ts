import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ConfigImportComponent } from "./config-import.component";
import { ConfigSetupModule } from "../config-setup.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ConfigService } from "../../config/config.service";

export default {
  title: "Core/Config Import",
  component: ConfigImportComponent,
  decorators: [
    moduleMetadata({
      imports: [ConfigSetupModule, StorybookBaseModule],
      providers: [
        {
          provide: ConfigService,
          useValue: { getAllConfigs: () => [] },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<ConfigImportComponent> = (
  args: ConfigImportComponent
) => ({
  component: ConfigImportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
