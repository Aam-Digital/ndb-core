import { Component, Input, OnInit } from "@angular/core";
import { Note } from "../model/note";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityListComponent } from "../../../core/entity-list/entity-list/entity-list.component";
import { applyUpdate } from "../../../core/entity/model/entity-update";
import {
  ColumnGroupsConfig,
  FilterConfig,
} from "../../../core/entity-list/EntityListConfig";
import { EventNote } from "../../attendance/model/event-note";
import { merge } from "rxjs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Angulartics2Module } from "angulartics2";
import { MatMenuModule } from "@angular/material/menu";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouteTarget } from "../../../route-target";
import { Sort } from "@angular/material/sort";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";

/**
 * additional config specifically for NotesManagerComponent
 */
export interface NotesManagerConfig {
  /** whether to also load EventNote entities in addition to Note entities */
  includeEventNotes?: boolean;

  /** whether a toggle control is displayed to users, allowing to change the "includeEventNotes" state */
  showEventNotesToggle?: boolean;
}

@RouteTarget("NotesManager")
@Component({
  selector: "app-notes-manager",
  templateUrl: "./notes-manager.component.html",
  imports: [
    EntityListComponent,
    MatSlideToggleModule,
    NgIf,
    FormsModule,
    Angulartics2Module,
    MatMenuModule,
    FaDynamicIconComponent,
  ],
  standalone: true,
})
@UntilDestroy()
export class NotesManagerComponent implements OnInit {
  // inputs to be passed through to EntityList
  @Input() defaultSort: Sort;
  @Input() exportConfig: ExportColumnConfig[];
  @Input() showInactive: boolean;
  @Input() title = "";
  @Input() columns: (FormFieldConfig | string)[] = [];
  @Input() columnGroups: ColumnGroupsConfig;
  @Input() filters: FilterConfig[] = [];

  @Input() includeEventNotes: boolean;
  @Input() showEventNotesToggle: boolean;

  // not used anymore, but throwing errors when missing
  @Input() entityType: any;

  entityConstructor = Note;
  notes: Note[];

  constructor(
    private formDialog: FormDialogService,
    private entityMapperService: EntityMapperService,
  ) {}

  async ngOnInit() {
    this.notes = await this.loadEntities();
    this.subscribeEntityUpdates();
  }

  private async loadEntities(): Promise<Note[]> {
    let notes = await this.entityMapperService.loadType(Note);
    if (this.includeEventNotes) {
      const eventNotes = await this.entityMapperService.loadType(EventNote);
      notes = notes.concat(eventNotes);
    }
    return notes;
  }

  private subscribeEntityUpdates() {
    merge(
      this.entityMapperService.receiveUpdates(Note),
      this.entityMapperService.receiveUpdates(EventNote),
    )
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
    this.includeEventNotes = !this.includeEventNotes;
    this.notes = await this.loadEntities();
  }

  addNoteClick() {
    const newNote = new Note(Date.now().toString());
    this.showDetails(newNote);
  }

  showDetails(entity: Note) {
    this.formDialog.openView(entity, "NoteDetails");
  }
}
