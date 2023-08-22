import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { AttendanceStatusSelectComponent } from "./attendance-status-select.component";
import { ConfigurableEnumService } from "../../../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";

export default {
  title: "Features/Attendance/Components/AttendanceStatusSelect",
  component: AttendanceStatusSelectComponent,
  decorators: [
    moduleMetadata({
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

const Template: StoryFn<AttendanceStatusSelectComponent> = (
  args: AttendanceStatusSelectComponent,
) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  value: defaultAttendanceStatusTypes[0],
};
