import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { ConfigService } from "../../../core/config/config.service";
import { NoteConfig } from "./note-config.interface";

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

  interactionTypes: {
    [key: string]: {
      name: string;
      color?: string;
      isMeeting?: boolean;
    };
  };

  constructor(private configService: ConfigService) {}

  ngOnInit() {
    this.interactionTypes = this.configService.getConfig<NoteConfig>(
      this.CONFIG_ID
    ).InteractionTypes;
    Object.freeze(this.interactionTypes);
  }
}
