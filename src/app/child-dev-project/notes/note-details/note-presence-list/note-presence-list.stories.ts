import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { ConfigurableEnumModule } from "../../../../core/configurable-enum/configurable-enum.module";
import { NotesModule } from "../../notes.module";
import { NotePresenceListComponent } from "./note-presence-list.component";
import { Note } from "../../model/note";
import { ChildrenService } from "../../../children/children.service";
import { of } from "rxjs";
import { RouterTestingModule } from "@angular/router/testing";
import { FontAwesomeIconsModule } from "../../../../core/icons/font-awesome-icons.module";
import { DemoChildGenerator } from "../../../children/demo-data-generators/demo-child-generator.service";

const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];

export default {
  title: "Child Dev Project/NotePresenceList",
  component: NotePresenceListComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        RouterTestingModule,
        FontAwesomeIconsModule,
        ConfigurableEnumModule,
        NotesModule,
      ],
      providers: [
        {
          provide: ChildrenService,
          useValue: {
            getChild: (id) => of(demoChildren.find((c) => c.getId() === id)),
            getChildren: () => of(demoChildren),
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<NotePresenceListComponent> = (
  args: NotePresenceListComponent
) => ({
  component: NotePresenceListComponent,
  props: args,
});

const eventNote = Note.create(new Date(), "Coaching today");
eventNote.category = { id: "COACHING", label: "Coaching", isMeeting: true };
eventNote.addChild(demoChildren[0].getId());
eventNote.addChild(demoChildren[1].getId());

export const Primary = Template.bind({});
Primary.args = {
  entity: eventNote,
};
