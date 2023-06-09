import { Meta, Story } from "@storybook/angular/types-6-0";
import { RollCallComponent } from "./roll-call.component";
import { DemoChildGenerator } from "../../../children/demo-data-generators/demo-child-generator.service";
import { moduleMetadata } from "@storybook/angular";
import { Note } from "../../../notes/model/note";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { mockEntityMapper } from "../../../../core/entity/mock-entity-mapper-service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";

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
