import { ComponentTuple } from "../../dynamic-components";

export const notesComponents: ComponentTuple[] = [
  [
    "NotesManager",
    () =>
      import("./notes-manager/notes-manager.component").then(
        (c) => c.NotesManagerComponent,
      ),
  ],
  [
    "NoteAttendanceCountBlock",
    () =>
      import("./note-attendance-block/note-attendance-count-block.component").then(
        (c) => c.NoteAttendanceCountBlockComponent,
      ),
  ],
  [
    "NotesDashboard",
    () =>
      import("./dashboard-widgets/notes-dashboard/notes-dashboard.component").then(
        (c) => c.NotesDashboardComponent,
      ),
  ],

  [
    "NotesRelatedToEntity",
    () =>
      import("./notes-related-to-entity/notes-related-to-entity.component").then(
        (c) => c.NotesRelatedToEntityComponent,
      ),
  ],
  [
    "ImportantNotesDashboard",
    () =>
      import("./dashboard-widgets/important-notes-dashboard/important-notes-dashboard.component").then(
        (c) => c.ImportantNotesDashboardComponent,
      ),
  ],
  [
    "NoteDetails",
    () =>
      import("./note-details/note-details.component").then(
        (c) => c.NoteDetailsComponent,
      ),
  ],
  [
    "ImportantNotesDashboardSettings",
    () =>
      import("./dashboard-widgets/important-notes-dashboard-settings.component/important-notes-dashboard-settings.component").then(
        (c) => c.ImportantNotesDashboardSettingsComponent,
      ),
  ],
  [
    "NotesDashboardSettings",
    () =>
      import("./dashboard-widgets/notes-dashboard-settings.component/notes-dashboard-settings.component").then(
        (c) => c.NotesDashboardSettingsComponent,
      ),
  ],
];
