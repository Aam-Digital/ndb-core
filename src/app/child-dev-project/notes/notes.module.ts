import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { notesComponents } from "./notes-components";
import { Note } from "./model/note";

@NgModule({})
export class NotesModule {
  static databaseEntities = [Note];

  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(notesComponents);
  }
}
