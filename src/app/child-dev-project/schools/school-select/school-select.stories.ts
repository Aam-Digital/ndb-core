import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Angulartics2Module } from "angulartics2";
import { SchoolSelectComponent } from "./school-select.component";
import { SchoolsModule } from "../schools.module";
import { DemoSchoolGenerator } from "../demo-school-generator.service";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

const schools = new DemoSchoolGenerator({ count: 10 }).generateEntities();

export default {
  title: "Schools/Components/SchoolSelect",
  component: SchoolSelectComponent,
  decorators: [
    moduleMetadata({
      imports: [
        SchoolsModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        Angulartics2Module.forRoot(),
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: {
            loadType: () => Promise.resolve(schools),
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<SchoolSelectComponent> = (
  args: SchoolSelectComponent
) => ({
  component: SchoolSelectComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  disabled: false,
};

export const Secondary = Template.bind({});
Secondary.args = {
  selectedSchoolIds: [schools[0].getId(), schools[1].getId()],
  disabled: false,
};
