import { Component, OnInit, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { MediaObserver } from "@angular/flex-layout";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import { ActivatedRoute } from "@angular/router";
import { WarningLevel } from "../../warning-level";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { FilterSelectionOption } from "../../../core/filter/filter-selection/filter-selection";
import { SessionService } from "../../../core/session/session-service/session.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { LoggingService } from "../../../core/logging/logging.service";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";
import { applyUpdate } from "../../../core/entity/entity-update";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { Input } from "@angular/core";
import { EventNote } from "app/child-dev-project/attendance/model/event-note";
import { EntityConstructor } from "app/core/entity/entity";

/**
 * additional config specifically for NotesManagerComponent
 */
export interface NotesManagerConfig {
  /** whether to also load EventNote entities in addition to Note entities */
  includeEventNotes?: boolean;

  /** whether a toggle control is displayed to users, allowing to change the "includeEventNotes" state */
  showEventNotesToggle?: boolean;
}

@Component({
  selector: "app-notes-manager",
  templateUrl: "./notes-manager.component.html",
  styleUrls: ["./notes-manager.component.scss"],
})
@UntilDestroy()
export class NotesManagerComponent implements OnInit {
  @ViewChild("entityList") entityList: EntityListComponent<Note>;

  @Input() includeEventNotes: boolean;
  @Input() showEventNotesToggle: boolean;

  config: EntityListConfig;
  noteConstructor = Note;
  notes: Note[] = [];

  private statusFS: FilterSelectionOption<Note>[] = [
    {
      key: "urgent",
      label: $localize`:Filter-option for notes:Urgent`,
      filterFun: (n: Note) => n.warningLevel === WarningLevel.URGENT,
    },
    {
      key: "follow-up",
      label: $localize`:Filter-option for notes:Needs Follow-Up`,
      filterFun: (n: Note) =>
        n.warningLevel === WarningLevel.WARNING ||
        n.warningLevel === WarningLevel.URGENT,
    },
    { key: "", label: $localize`All`, filterFun: () => true },
  ];

  private dateFS: FilterSelectionOption<Note>[] = [
    {
      key: "current-week",
      label: $localize`:Filter-option for notes:This Week`,
      filterFun: (n: Note) => n.date > this.getPreviousSunday(0),
    },
    {
      key: "last-week",
      label: $localize`:Filter-option for notes:Since Last Week`,
      filterFun: (n: Note) => n.date > this.getPreviousSunday(1),
    },
    { key: "", label: $localize`All`, filterFun: () => true },
  ];

  constructor(
    private formDialog: FormDialogService,
    private sessionService: SessionService,
    private media: MediaObserver,
    private entityMapperService: EntityMapperService,
    private route: ActivatedRoute,
    private log: LoggingService
  ) {}

  async ngOnInit() {
    this.route.data.subscribe(
      async (config: EntityListConfig & NotesManagerConfig) => {
        this.config = config;
        this.addPrebuiltFilters();

        this.includeEventNotes = config.includeEventNotes;
        this.showEventNotesToggle = config.showEventNotesToggle;
        this.notes = await this.loadEntities();
      }
    );

    this.subscribeEntityUpdates(Note);
    this.subscribeEntityUpdates(EventNote);
  }

  private async loadEntities(): Promise<Note[]> {
    let notes = await this.entityMapperService.loadType(Note);
    if (this.includeEventNotes) {
      const eventNotes = await this.entityMapperService.loadType(EventNote);
      notes = notes.concat(eventNotes);
    }
    return notes;
  }

  private subscribeEntityUpdates(
    entityType: EntityConstructor<Note | EventNote>
  ) {
    this.entityMapperService
      .receiveUpdates<Note>(entityType)
      .pipe(untilDestroyed(this))
      .subscribe((updatedNote) => {
        if (
          !this.includeEventNotes &&
          updatedNote?.entity?.getType() === EventNote.ENTITY_TYPE
        ) {
          return;
        }

        this.notes = applyUpdate(this.notes, updatedNote);
      });
  }

  async updateIncludeEvents() {
    this.notes = await this.loadEntities();
  }

  private addPrebuiltFilters() {
    this.config.filters.forEach((f) => {
      if (f.type === "prebuilt") {
        switch (f.id) {
          case "status": {
            f["options"] = this.statusFS;
            f["default"] = "";
            return;
          }
          case "date": {
            f["options"] = this.dateFS;
            f["default"] = "current-week";
            return;
          }
          default: {
            this.log.warn(
              "[NoteManagerComponent] No filter options available for prebuilt filter: " +
                f.id
            );
            return (f["options"] = []);
          }
        }
      }
    });
  }

  private getPreviousSunday(weeksBack: number) {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day - 7 * weeksBack; // adjust when day is sunday
    return new Date(today.setDate(diff));
  }

  addNoteClick() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.author = this.sessionService.getCurrentUser().name;
    this.showDetails(newNote);
  }

  showDetails(entity: Note) {
    this.formDialog.openDialog(NoteDetailsComponent, entity.copy());
  }
}
