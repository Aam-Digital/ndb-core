import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { Child } from "../../children/model/child";
import { MatDialogRef } from "@angular/material/dialog";
import { NEVER } from "rxjs";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

const demoChildren: Child[] = [Child.create("Joe"), Child.create("Jane")];

export default {
  title: "Features/NoteDetails",
  component: NoteDetailsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData(demoChildren)),
      ],
    }),
    moduleMetadata({
      providers: [
        {
          provide: MatDialogRef,
          useValue: { backdropClick: () => NEVER, afterClosed: () => NEVER },
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
eventNote.addChild(demoChildren[0].getId(true));
eventNote.addChild(demoChildren[1].getId(true));

export const EventWithAttendance = Template.bind({});
EventWithAttendance.args = {
  entity: eventNote,
};
