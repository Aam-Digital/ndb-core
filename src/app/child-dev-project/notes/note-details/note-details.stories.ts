import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { ConfigurableEnumModule } from "../../../core/configurable-enum/configurable-enum.module";
import { NotesModule } from "../notes.module";
import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MatNativeDateModule } from "@angular/material/core";
import { Angulartics2Module } from "angulartics2";
import { Child } from "../../children/model/child";
import { MatDialogRef } from "@angular/material/dialog";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { ChildrenService } from "../../children/children.service";
import { of } from "rxjs";
import { SessionService } from "../../../core/session/session-service/session.service";

const demoChildren: Child[] = [Child.create("Joe"), Child.create("Jane")];

export default {
  title: "Child Dev Project/NoteDetails",
  component: NoteDetailsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        RouterTestingModule,
        MatNativeDateModule,
        Angulartics2Module.forRoot(),
        ConfigurableEnumModule,
        NotesModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: MatDialogRef, useValue: {} },
        { provide: SessionService, useValue: {} },
        {
          provide: ChildrenService,
          useValue: { getChild: () => of(new Child()) },
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
