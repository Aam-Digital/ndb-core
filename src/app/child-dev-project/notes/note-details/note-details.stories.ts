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

const Template: StoryFn<NoteDetailsComponent> = (
  args: NoteDetailsComponent,
) => ({
  component: NoteDetailsComponent,
  props: args,
});

export const Primary = {
  render: Template,

  args: {
    entity: new Note(),
  },
};

const eventNote = Note.create(new Date(), "Coaching today");
eventNote.category = { id: "COACHING", label: "Coaching", isMeeting: true };
eventNote.addChild(demoChildren[0].getId());
eventNote.addChild(demoChildren[1].getId());

export const EventWithAttendance = {
  render: Template,

  args: {
    entity: eventNote,
  },
};
