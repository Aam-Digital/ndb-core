import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { notesComponents } from "./notes-components";

@NgModule({})
export class NotesModule {
  constructor(components: ComponentRegistry) {
    components.addAll(notesComponents);
  }
}
