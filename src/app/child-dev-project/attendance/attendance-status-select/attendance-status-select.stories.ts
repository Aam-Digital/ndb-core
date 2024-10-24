import { Meta, moduleMetadata, StoryFn, StoryObj } from "@storybook/angular";
import { AttendanceStatusSelectComponent } from "./attendance-status-select.component";
import { ConfigurableEnumService } from "../../../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

export default {
  title: "Features/Attendance/Components/AttendanceStatusSelect",
  component: AttendanceStatusSelectComponent,
  decorators: [
    moduleMetadata({
      imports: [BrowserAnimationsModule],
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

export const Primary: StoryObj<AttendanceStatusSelectComponent> = {
  args: {
    value: defaultAttendanceStatusTypes[0],
  },
};
