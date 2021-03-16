import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { MediaObserver } from "@angular/flex-layout";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import { ActivatedRoute } from "@angular/router";
import { WarningLevel, WarningLevelColor } from "../../warning-level";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { FilterSelectionOption } from "../../../core/filter/filter-selection/filter-selection";
import { SessionService } from "../../../core/session/session-service/session.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { UntilDestroy } from "@ngneat/until-destroy";
import { LoggingService } from "../../../core/logging/logging.service";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";
import { Subscription } from "rxjs";
import { map } from "rxjs/operators";
import { updateEntities } from "../../../core/entity/entity-update";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";

@UntilDestroy()
@Component({
  selector: "app-notes-manager",
  template: `
    <app-entity-list
      [entityList]="notes"
      [listConfig]="config"
      [entityConstructor]="noteConstructor"
      (elementClick)="showDetails($event)"
      (addNewClick)="addNoteClick()"
      #entityList
    ></app-entity-list>
  `,
})
export class NotesManagerComponent implements OnInit, OnDestroy {
  @ViewChild("entityList") entityList: EntityListComponent<Note>;

  config: EntityListConfig;
  noteConstructor = Note;
  notes: Note[] = [];

  private statusFS: FilterSelectionOption<Note>[] = [
    {
      key: "urgent",
      label: "Urgent",
      filterFun: (n: Note) => n.warningLevel === WarningLevel.URGENT,
    },
    {
      key: "follow-up",
      label: "Needs Follow-Up",
      filterFun: (n: Note) =>
        n.warningLevel === WarningLevel.WARNING ||
        n.warningLevel === WarningLevel.URGENT,
    },
    { key: "", label: "All", filterFun: () => true },
  ];

  private dateFS: FilterSelectionOption<Note>[] = [
    {
      key: "current-week",
      label: "This Week",
      filterFun: (n: Note) => n.date > this.getPreviousSunday(0),
    },
    {
      key: "last-week",
      label: "Since Last Week",
      filterFun: (n: Note) => n.date > this.getPreviousSunday(1),
    },
    { key: "", label: "All", filterFun: () => true },
  ];

  private subscription: Subscription;

  constructor(
    private formDialog: FormDialogService,
    private sessionService: SessionService,
    private media: MediaObserver,
    private entityMapperService: EntityMapperService,
    private route: ActivatedRoute,
    private log: LoggingService
  ) {}

  ngOnInit() {
    this.route.data.subscribe((config: EntityListConfig) => {
      this.config = config;
      this.addPrebuiltFilters();
    });
    this.subscription = this.entityMapperService
      .loadAll<Note>(Note)
      .pipe(
        map((note) => {
          if (note) {
            note["color"] = this.getColor(note);
          }
          return note;
        }),
        updateEntities()
      )
      .subscribe((update) => {
        this.notes = update(this.notes);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

  private getColor(entity: Note): string {
    if (entity.warningLevel === WarningLevel.URGENT) {
      return WarningLevelColor(WarningLevel.URGENT);
    }
    if (entity.warningLevel === WarningLevel.WARNING) {
      return WarningLevelColor(WarningLevel.WARNING);
    }

    const color = entity.category?.color;
    return color ? color : "";
  }
}
