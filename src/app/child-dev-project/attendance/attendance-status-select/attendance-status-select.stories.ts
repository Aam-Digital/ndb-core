import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { AttendanceStatusSelectComponent } from "./attendance-status-select.component";
import { ConfigurableEnumService } from "../../../core/configurable-enum/configurable-enum.service";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";

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
      providers: [
        {
          provide: ConfigurableEnumService,
          useValue: { getEnumValues: () => defaultAttendanceStatusTypes },
        },
      ],
    }),
  ],
  parameters: {
    controls: {
      exclude: ["compareFn"],
    },
  },
} as Meta;

const Template: Story<AttendanceStatusSelectComponent> = (
  args: AttendanceStatusSelectComponent
) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  value: defaultAttendanceStatusTypes[0],
};
