import { Meta, Story } from "@storybook/angular/types-6-0";
import { RollCallComponent } from "./roll-call.component";
import { DemoChildGenerator } from "../../../children/demo-data-generators/demo-child-generator.service";
import { moduleMetadata } from "@storybook/angular";
import { Note } from "../../../notes/model/note";
import { AttendanceModule } from "../../attendance.module";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { mockEntityMapper } from "../../../../core/entity/mock-entity-mapper-service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { ChildrenService } from "../../../children/children.service";

const demoEvent = Note.create(new Date(), "coaching");
const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];
demoChildren.forEach((c) => demoEvent.addChild(c));

export default {
  title: "Attendance/Views/RollCall",
  component: RollCallComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, AttendanceModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(demoChildren),
        },
        {
          provide: ChildrenService,
          useValue: {},
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
};

export const Finished = Template.bind({});
Finished.args = {
  eventEntity: new Note(),
  children: [],
};
