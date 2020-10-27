import { Injectable } from "@angular/core";
import { ConfigService } from "app/core/config/config.service";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { InteractionSchemaDatatype } from "./note-details/interaction-schema-datatype";
import {
  InteractionType,
  NoteConfig,
} from "./note-details/note-config.interface";

/**
 * Service loads data from config file regarding notes; inject to components where necessary
 */
@Injectable()
export class NoteConfigLoaderService {
  /** name of config array in the config json file */
  private readonly CONFIG_ID = "notes";
  private readonly config: NoteConfig;
  /** All available note categorys */
  public readonly interactionTypes: InteractionType[];

  constructor(
    private configService: ConfigService,
    private entitySchemaService: EntitySchemaService
  ) {
    this.config = this.configService.getConfig<NoteConfig>(this.CONFIG_ID);
    // setupt interaction-type with entity schema service based upon categorys from config
    this.entitySchemaService.registerSchemaDatatype(
      new InteractionSchemaDatatype(this.config)
    );
    // retrieve note categorys from config file
    this.interactionTypes = Object.values(this.config.InteractionTypes);
  }
}
