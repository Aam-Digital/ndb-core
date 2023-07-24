import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { Child } from "../../children/model/child";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ChildrenService } from "../../children/children.service";
import { NEVER, of } from "rxjs";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

const demoChildren: Child[] = [Child.create("Joe"), Child.create("Jane")];

export default {
  title: "Features/NoteDetails",
  component: NoteDetailsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        NoteDetailsComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { data: { entity: Note.create(new Date()) } },
        },
        {
          provide: MatDialogRef,
          useValue: { backdropClick: () => NEVER, afterClosed: () => NEVER },
        },
        {
          provide: ChildrenService,
          useValue: { getChild: () => of(Child.create("John Doe")) },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<NoteDetailsComponent> = (
  args: NoteDetailsComponent,
) => ({
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
