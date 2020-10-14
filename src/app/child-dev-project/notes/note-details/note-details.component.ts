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

  /** interaction types loaded from config file */
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

  /**
   * function returns zero; used to circumvent TS error in template
   * (This function is used to sort the interactionTypes in the keyvalue-pipe.
   * Since we want to keep the sorting from the config file, we simply return 0 all the time.)
   */
  returnZero() {
    return 0;
  }
}
