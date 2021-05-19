import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { CommonModule, DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { PreviousSchoolsComponent } from "./previous-schools.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";

export default {
  title: "child-dev-project/Previous Schools",
  component: PreviousSchoolsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        RouterTestingModule,
        EntitySubrecordModule,
        CommonModule,
        NoopAnimationsModule,
        MatFormFieldModule,
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
        DatePipe,
      ],
    }),
  ],
} as Meta;

const Template: Story<PreviousSchoolsComponent> = (
  args: PreviousSchoolsComponent
) => ({
  component: PreviousSchoolsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
