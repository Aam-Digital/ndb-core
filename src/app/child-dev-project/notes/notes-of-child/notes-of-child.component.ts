import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Note } from "../model/note";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import { ChildrenService } from "../../children/children.service";
import moment from "moment";
import { SessionService } from "../../../core/session/session-service/session.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../../core/entity/model/entity";
import {
  ColumnConfig,
  EntitySubrecordConfig,
} from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { ConfigService } from "../../../core/config/config.service";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";

/**
 * The component that is responsible for listing the Notes that are related to a certain child
 *
 * TODO rename this to a more general name as this can also handle notes of schools and notes of authors
 */
@DynamicComponent("NotesOfChild")
@Component({
  selector: "app-notes-of-child",
  templateUrl: "./notes-of-child.component.html",
})
export class NotesOfChildComponent
  implements OnChanges, OnInitDynamicComponent
{
  @Input() entity: Entity;
  private noteProperty = "children";
  records: Array<Note> = [];

  columns: ColumnConfig[] = [
    { id: "date", visibleFrom: "xs" },
    { id: "subject", visibleFrom: "xs" },
    { id: "text", visibleFrom: "md" },
    { id: "authors", visibleFrom: "md" },
    { id: "warningLevel", visibleFrom: "md" },
  ];
  filter;

  /**
   * returns the color for a note; passed to the entity subrecord component
   * @param note note to get color for
   */
  getColor = (note: Note) => note?.getColor();
  newRecordFactory: () => Note;

  constructor(
    private childrenService: ChildrenService,
    private sessionService: SessionService,
    private formDialog: FormDialogService,
    private configService: ConfigService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.initNotesOfChild();
    }
  }

  onInitFromDynamicConfig(config: PanelConfig<EntitySubrecordConfig<Note>>) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }
    if (config?.config?.filter) {
      this.filter = config.config.filter;
    }

    this.entity = config.entity;
    const entityType = this.entity.getType();
    this.newRecordFactory = this.generateNewRecordFactory();

    this.noteProperty = [...Note.schema.keys()].find(
      (prop) => Note.schema.get(prop).additional === entityType
    );
    if (!this.noteProperty) {
      throw new Error(
        `Could not load notes for related entity: "${entityType}"`
      );
    }

    if (this.noteProperty === "children") {
      // When displaying notes for a child, use attendance color highlighting
      this.getColor = (note: Note) => note?.getColorForId(this.entity.getId());
    }

    this.initNotesOfChild();
  }

  private initNotesOfChild() {
    this.childrenService
      .getNotesOf(this.entity.getId(), this.noteProperty)
      .then((notes: Note[]) => {
        notes.sort((a, b) => {
          if (!a.date && b.date) {
            // note without date should be first
            return -1;
          }
          return moment(b.date).valueOf() - moment(a.date).valueOf();
        });
        this.records = notes;
      });
  }

  generateNewRecordFactory() {
    const user = this.sessionService.getCurrentUser().name;
    const entityId = this.entity.getId();

    return () => {
      const newNote = new Note(Date.now().toString());
      newNote.date = new Date();
      if (this.noteProperty === "children") {
        newNote.addChild(entityId);
      } else {
        newNote[this.noteProperty].push(entityId);
      }
      if (!newNote.authors.includes(user)) {
        newNote.authors.push(user);
      }
      this.applyValuesFromFilter(newNote);

      return newNote;
    };
  }

  private applyValuesFromFilter(newNote: Note) {
    const schema = newNote.getSchema();
    Object.entries(this.filter ?? {}).forEach(([key, value]) => {
      // TODO support arrays through recursion
      // TODO support dates through custom object matching {@link https://github.com/stalniy/ucast/tree/master/packages/js#custom-object-matching)
      if (typeof value !== "object") {
        this.assignValueToEntity(key, value, schema, newNote);
      }
    });
  }

  private assignValueToEntity(
    key: string,
    value,
    schema: Map<string, EntitySchemaField>,
    newNote: Note
  ) {
    if (key.includes(".")) {
      // TODO only one level deep nesting is supported (also by ucast https://github.com/stalniy/ucast/issues/32)
      [key, value] = this.transformNestedKey(key, value);
    }
    const property = schema.get(key);
    if (property.dataType === "configurable-enum") {
      value = this.parseConfigurableEnumValue(property, value);
    }
    newNote[key] = value;
  }

  private transformNestedKey(key: string, value): any[] {
    const [first, second] = key.split(".");
    return [first, { [second]: value }];
  }

  private parseConfigurableEnumValue(property: EntitySchemaField, value) {
    const enumValues = this.configService.getConfigurableEnumValues(
      property.innerDataType
    );
    return enumValues.find(({ id }) => id === value["id"]);
  }

  showNoteDetails(note: Note) {
    this.formDialog.openDialog(NoteDetailsComponent, note);
  }
}
