import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { ConfigService } from "../../../core/config/config.service";
import { InteractionType, NoteConfig } from "./note-config.interface";
import { InteractionSchemaDatatype } from "./interaction-schema-datatype";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";

@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
})
export class NoteDetailsComponent implements ShowsEntity, OnInit {
  @Input() entity: Note;
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  /** name of config array in the config json file */
  private readonly CONFIG_ID = "notes";

  /** interaction types loaded from config file */
  interactionTypes: InteractionType[];

  constructor(
    private configService: ConfigService,
    private entitySchemaService: EntitySchemaService
  ) {
    this.entitySchemaService.registerSchemaDatatype(
      new InteractionSchemaDatatype(
        this.configService.getConfig<NoteConfig>(this.CONFIG_ID)
      )
    );
  }

  ngOnInit() {
    this.interactionTypes = Object.values(
      this.configService.getConfig<NoteConfig>(this.CONFIG_ID).InteractionTypes
    );
    Object.freeze(this.interactionTypes);
  }
}
