import { Component, Input, OnInit } from "@angular/core";
import { Note } from "../model/note";
import { ActivatedRoute } from "@angular/router";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityListComponent } from "../../../core/entity-list/entity-list/entity-list.component";
import { applyUpdate } from "../../../core/entity/model/entity-update";
import { EntityListConfig } from "../../../core/entity-list/EntityListConfig";
import { EventNote } from "../../attendance/model/event-note";
import { DynamicComponentConfig } from "../../../core/config/dynamic-components/dynamic-component-config.interface";
import { merge } from "rxjs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Angulartics2Module } from "angulartics2";
import { MatMenuModule } from "@angular/material/menu";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { RouteTarget } from "../../../route-target";

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
  @Input() includeEventNotes: boolean;
  @Input() showEventNotesToggle: boolean;

  config: EntityListConfig;
  entityConstructor = Note;
  notes: Note[];

  constructor(
    private formDialog: FormDialogService,
    private entityMapperService: EntityMapperService,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.route.data.subscribe(
      async (
        data: DynamicComponentConfig<EntityListConfig & NotesManagerConfig>,
      ) => {
        // TODO replace this use of route and rely on the RoutedViewComponent instead
        this.config = data.config;
        this.notes = await this.loadEntities();
      },
    );

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
