import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { notesComponents } from "./notes-components";
import { Note } from "./model/note";
import { DashboardWidgetRegistryService } from "../../core/dashboard/dashboard-widget-registry.service";

@NgModule({})
export class NotesModule {
  static databaseEntities = [Note];

  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register("ImportantNotesDashboard", "ImportantNotesDashboardSettings");
    this.widgetRegistry.register("NotesDashboard", "NotesDashboardSettings");

    const components = inject(ComponentRegistry);

    components.addAll(notesComponents);
  }
}
