import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DataImportComponent } from "./data-import.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ConfigurableEnumService } from "../../../core/configurable-enum/configurable-enum.service";
import { createTestingConfigurableEnumService } from "../../../core/configurable-enum/configurable-enum-testing";

export default {
  title: "Features/DataImport",
  component: DataImportComponent,
  decorators: [
    moduleMetadata({
      imports: [DataImportComponent, StorybookBaseModule],
      declarations: [],
      providers: [
        {
          provide: ConfigurableEnumService,
          useValue: createTestingConfigurableEnumService(),
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<DataImportComponent> = (args: DataImportComponent) => ({
  component: DataImportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
