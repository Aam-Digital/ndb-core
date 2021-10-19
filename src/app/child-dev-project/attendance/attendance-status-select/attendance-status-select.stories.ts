import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { AttendanceModule } from "../attendance.module";
import { RouterTestingModule } from "@angular/router/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { AttendanceStatusSelectComponent } from "./attendance-status-select.component";
import { ConfigService } from "../../../core/config/config.service";

export default {
  title: "Attendance/Components/AttendanceStatusSelect",
  component: AttendanceStatusSelectComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        FormDialogModule,
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
