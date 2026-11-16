import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { DefaultConfigMigrationRegistryService } from "../../core/config/default-config-migration-registry.service";
import { addDefaultWhiteboardViews } from "./add-default-whiteboard-views";
import { Whiteboard } from "./model/whiteboard";
import { whiteboardComponents } from "./whiteboard-components";

@NgModule({})
export class WhiteboardModule {
  static readonly databaseEntities = [Whiteboard];

  constructor() {
    inject(ComponentRegistry).addAll(whiteboardComponents);
    inject(DefaultConfigMigrationRegistryService).register(
      addDefaultWhiteboardViews,
    );
  }
}
