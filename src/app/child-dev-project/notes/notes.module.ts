import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { notesComponents } from "./notes-components";
import { Note } from "./model/note";
import { DashboardWidgetRegistryService } from "../../core/dashboard/dashboard-widget-registry.service";
import { DefaultConfigMigrationRegistryService } from "../../core/config/default-config-migration-registry.service";
import { addDefaultNoteViews } from "./add-default-note-views";

@NgModule({})
export class NotesModule {
  static databaseEntities = [Note];

  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register({
      component: "ImportantNotesDashboard",
      label: $localize`Important Notes`,
      settingsComponent: "ImportantNotesDashboardSettings",
      defaultConfig: { warningLevels: ["WARNING", "URGENT"] },
    });

    this.widgetRegistry.register({
      component: "NotesDashboard",
      label: $localize`Notes`,
      settingsComponent: "NotesDashboardSettings",
      defaultConfig: {
        sinceDays: 28,
        fromBeginningOfWeek: false,
        mode: "with-recent-notes",
      },
    });

    const components = inject(ComponentRegistry);

    components.addAll(notesComponents);

    inject(DefaultConfigMigrationRegistryService).register(addDefaultNoteViews);
  }
}
