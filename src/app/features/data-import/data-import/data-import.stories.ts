import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DataImportModule } from "../data-import.module";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { DynamicEntityService } from "../../../core/entity/dynamic-entity.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { CsvValidationStatus } from "../csv-validation-status.enum";

let mockEntityMap: Map<string, EntityConstructor>;
mockEntityMap = new Map<"Participant", EntityConstructor<Child>>();

export default {
  title: "Features/DataImport",
  component: DataImportComponent,
  decorators: [
    moduleMetadata({
      imports: [DataImportModule, FontAwesomeTestingModule],
      declarations: [],
      providers: [
        {
          provide: DataImportService,
          useValue: {
            handleCsvImport: () => Promise.resolve(),
            validateCsvFile: () =>
              Promise.resolve({ status: CsvValidationStatus.Valid }),
          },
        },
        {
          provide: DynamicEntityService,
          useValue: new DynamicEntityService(undefined, undefined),
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
