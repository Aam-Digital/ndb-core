import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { DataImportComponent } from "./data-import.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

let mockEntityMap: Map<string, EntityConstructor>;
mockEntityMap = new Map<"Participant", EntityConstructor<Child>>();

export default {
  title: "Features/DataImport",
  component: DataImportComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DataImportComponent> = (args: DataImportComponent) => ({
  component: DataImportComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
