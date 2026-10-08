import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { MatDialogRef } from "@angular/material/dialog";
import { NEVER } from "rxjs";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";

const demoChildren: Entity[] = [
  createEntityOfType("Child"),
  createEntityOfType("Child"),
];
demoChildren[0]["name"] = "Joe";
demoChildren[1]["name"] = "Jane";

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

const Template: StoryFn<NoteDetailsComponent> = (args) => ({
  component: NoteDetailsComponent,
  props: args,
});

export const Primary = {
  render: Template,

  args: {
    entity: new Note(),
  },
};

const meetingNote = Note.create(
  new Date(),
  "Coaching today",
  demoChildren.map((child) => child.getId()),
);
meetingNote.category = { id: "COACHING", label: "Coaching", isMeeting: true };

export const MeetingWithRelatedRecords = {
  render: Template,

  args: {
    entity: meetingNote,
  },
};
