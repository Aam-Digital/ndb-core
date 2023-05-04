import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { AttendanceStatusSelectComponent } from "./attendance-status-select.component";
import { ConfigService } from "../../../core/config/config.service";

export default {
  title: "Features/Attendance/Components/AttendanceStatusSelect",
  component: AttendanceStatusSelectComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceStatusSelectComponent,
        RouterTestingModule,
        MatNativeDateModule,
      ],
      declarations: [],
      providers: [ConfigService],
    }),
  ],
} as Meta;

const Template: Story<AttendanceStatusSelectComponent> = (
  args: AttendanceStatusSelectComponent
) => ({
  component: AttendanceStatusSelectComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
