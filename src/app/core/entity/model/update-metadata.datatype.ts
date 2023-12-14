import { UpdateMetadata } from "./update-metadata";
import { SchemaEmbedDatatype } from "../../basic-datatypes/schema-embed/schema-embed.datatype";
import { EntityConstructor } from "./entity";
import { Injectable } from "@angular/core";
import { EntitySchemaService } from "../schema/entity-schema.service";

/**
 * Datatype for internally saved meta-data of entity edits.
 */
@Injectable()
export class UpdateMetadataDatatype extends SchemaEmbedDatatype {
  static override dataType = UpdateMetadata.DATA_TYPE;

  override embeddedType = UpdateMetadata as unknown as EntityConstructor;

  constructor(schemaService: EntitySchemaService) {
    super(schemaService);
  }
}
