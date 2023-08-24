import { Injector, NgModule } from "@angular/core";
import { CouchdbFileService } from "./couchdb-file.service";
import { environment } from "../../../environments/environment";
import { SessionType } from "../../core/session/session-type";
import { FileService } from "./file.service";
import { MockFileService } from "./mock-file.service";
import { serviceProvider } from "../../utils/utils";
import { ComponentRegistry } from "../../dynamic-components";
import { fileComponents } from "./file-components";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { FileDatatype } from "./file.datatype";

@NgModule({
  providers: [
    CouchdbFileService,
    MockFileService,
    serviceProvider(FileService, (injector: Injector) => {
      return environment.session_type === SessionType.synced
        ? injector.get(CouchdbFileService)
        : injector.get(MockFileService);
    }),
    { provide: DefaultDatatype, useClass: FileDatatype, multi: true },
  ],
})
export class FileModule {
  constructor(components: ComponentRegistry) {
    components.addAll(fileComponents);
  }
}
