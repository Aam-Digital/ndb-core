import { Story, Meta } from "@storybook/angular/types-6-0";
import { RollCallComponent } from "./roll-call.component";
import { DemoChildGenerator } from "../../../children/demo-data-generators/demo-child-generator.service";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { ChildBlockComponent } from "../../../children/child-block/child-block.component";
import { MatButtonModule } from "@angular/material/button";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Note } from "../../../notes/model/note";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ChildrenService } from "../../../children/children.service";
import { of } from "rxjs";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../../core/entity/mock-entity-mapper-service";

export default {
  title: "Attendance/Views/RollCall",
  component: RollCallComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        FlexLayoutModule,
        MatButtonModule,
      ],
      declarations: [ChildBlockComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(),
        },
        {
          provide: ChildrenService,
          useValue: {
            getChild: (id) => of(demoChildren.find((c) => c.getId() === id)),
          },
        },
      ],
    }),
  ],
} as Meta;

const demoEvent = Note.create(new Date(), "coaching");
const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];
demoChildren.forEach((c) => demoEvent.addChild(c.getId()));

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
