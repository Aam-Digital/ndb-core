import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DataImportModule } from "../data-import.module";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { DynamicEntityService } from "../../../core/entity/dynamic-entity.service";
import { Child } from "../../../child-dev-project/children/model/child";
import {Entity, EntityConstructor} from "../../../core/entity/model/entity";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {EntityMapperService} from "../../../core/entity/entity-mapper.service";

let mockEntityMap: Map<string, EntityConstructor>;
mockEntityMap = new Map<"Participant", EntityConstructor<Child>>()

const mockCsvFile: Blob = new Blob(["1;2;3"]);
let mockFirstForm: FormGroup;
let mockSecondForm: FormGroup;
// let mockFirstForm = new FormGroup({
// });
// let mockSecondForm = new FormGroup({
// });
//
// const form = new FormGroup({
//   first: new FormControl('Nancy', Validators.minLength(2)),
//   last: new FormControl('Drew'),
// });

export default {
  title: "Features/DataImport",
  component: DataImportComponent,
  decorators: [
    moduleMetadata({
      imports: [
        DataImportModule,
      ],
      declarations: [
      ],
      providers: [
        {
          provide: DataImportService,
          useValue: null
        },
        {
          provide: DynamicEntityService,
          useValue: { EntityMap: () => { return mockEntityMap } }
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<DataImportComponent> = (args: DataImportComponent) => ({
  component: DataImportComponent,
  props: args
});

export const Primary = Template.bind({});
Primary.args = {
  csvFile: mockCsvFile,
  firstFormGroup: mockFirstForm,
  secondFormGroup: mockSecondForm
};
