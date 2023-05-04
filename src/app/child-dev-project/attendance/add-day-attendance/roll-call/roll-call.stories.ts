import { Meta, Story } from "@storybook/angular/types-6-0";
import { RollCallComponent } from "./roll-call.component";
import { DemoChildGenerator } from "../../../children/demo-data-generators/demo-child-generator.service";
import { moduleMetadata } from "@storybook/angular";
import { Note } from "../../../notes/model/note";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { mockEntityMapper } from "../../../../core/entity/mock-entity-mapper-service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { ConfigService } from "../../../../core/config/config.service";
import { ATTENDANCE_STATUS_CONFIG_ID } from "../../model/attendance-status";
import { defaultAttendanceStatusTypes } from "../../../../core/config/default-config/default-attendance-status-types";

const demoEvent = Note.create(new Date(), "coaching");
const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];
demoChildren.forEach((c) => demoEvent.addChild(c));

export default {
  title: "Features/Attendance/Views/RollCall",
  component: RollCallComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, RollCallComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(demoChildren),
        },
        {
          provide: ConfigService,
          useValue: {
            getConfigurableEnumValues(id: string) {
              if (id === ATTENDANCE_STATUS_CONFIG_ID) {
                return defaultAttendanceStatusTypes;
              }
            },
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<RollCallComponent> = (args: RollCallComponent) => ({
  component: RollCallComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  eventEntity: demoEvent,
  children: demoChildren,
};

export const Finished = Template.bind({});
Finished.args = {
  eventEntity: new Note(),
  children: [],
};
