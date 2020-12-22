import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ChildAttendanceComponent } from "./child-attendance.component";
import { ChildrenService } from "../../children/children.service";
import { of } from "rxjs";
import { Child } from "../../children/model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { AttendanceMonth } from "../model/attendance-month";
import { MatNativeDateModule } from "@angular/material/core";
import { AttendanceModule } from "../attendance.module";
import { RouterTestingModule } from "@angular/router/testing";

const demoChild = new Child();
demoChild.name = "John Doe";

const demoInstitution = "coaching";

const attendances: AttendanceMonth[] = [
  AttendanceMonth.createAttendanceMonth(demoChild.getId(), demoInstitution),
  AttendanceMonth.createAttendanceMonth(demoChild.getId(), demoInstitution),
];
attendances[0].month = new Date("2020-01-01");
attendances[1].month = new Date("2020-02-01");

export default {
  title: "Child Dev Project/ChildAttendance",
  component: ChildAttendanceComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        BrowserAnimationsModule,
        FontAwesomeIconsModule,
        MatNativeDateModule,
        RouterTestingModule,
      ],
      declarations: [],
      providers: [
        {
          provide: ChildrenService,
          useValue: { getAttendancesOfChild: () => of(attendances) },
        },
        { provide: EntityMapperService, useValue: { save: () => {} } },
      ],
    }),
  ],
} as Meta;

const Template: Story<ChildAttendanceComponent> = (
  args: ChildAttendanceComponent
) => ({
  component: ChildAttendanceComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  institution: "coaching",
  showDailyAttendanceOfLatest: true,
  child: demoChild,
};
