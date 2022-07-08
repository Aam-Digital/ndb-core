import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { NotesModule } from "../notes.module";
import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { Child } from "../../children/model/child";
import { MatDialogRef } from "@angular/material/dialog";
import { ChildrenService } from "../../children/children.service";
import { of } from "rxjs";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

const demoChildren: Child[] = [Child.create("Joe"), Child.create("Jane")];

export default {
  title: "Child Dev Project/NoteDetails",
  component: NoteDetailsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        NotesModule,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: ChildrenService,
          useValue: { getChild: () => of(Child.create("John Doe")) },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<NoteDetailsComponent> = (args: NoteDetailsComponent) => ({
  component: NoteDetailsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: new Note(),
};

const eventNote = Note.create(new Date(), "Coaching today");
eventNote.category = { id: "COACHING", label: "Coaching", isMeeting: true };
eventNote.addChild(demoChildren[0].getId());
eventNote.addChild(demoChildren[1].getId());

export const EventWithAttendance = Template.bind({});
Primary.args = {
  entity: eventNote,
};
