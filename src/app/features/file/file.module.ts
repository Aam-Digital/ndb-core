import { Injector, NgModule } from "@angular/core";
import { CouchdbFileService } from "./couchdb-file.service";
import { environment } from "../../../environments/environment";
import { SessionType } from "../../core/session/session-type";
import { FileService } from "./file.service";
import { MockFileService } from "./mock-file.service";
import { serviceProvider } from "../../utils/utils";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { fileDataType } from "./file-data-type";
import { ComponentRegistry } from "../../dynamic-components";
import { fileComponents } from "./file-components";

@NgModule({
  providers: [
    CouchdbFileService,
    MockFileService,
    serviceProvider(FileService, (injector: Injector) => {
      return environment.session_type === SessionType.synced
        ? injector.get(CouchdbFileService)
        : injector.get(MockFileService);
    }),
  ],
})
export class FileModule {
  constructor(
    entitySchemaService: EntitySchemaService,
    components: ComponentRegistry
  ) {
    entitySchemaService.registerSchemaDatatype(fileDataType);
    components.addAll(fileComponents);
  }
}
