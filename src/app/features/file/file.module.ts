import {
  Injector,
  NgModule,
  inject,
  provideAppInitializer,
} from "@angular/core";
import { CouchdbFileService } from "./couchdb-file.service";
import { hasRemoteSession } from "../../core/session/session-type";
import { environment } from "../../../environments/environment";
import { FileService } from "./file.service";
import { MockFileService } from "./mock-file.service";
import { serviceProvider } from "../../utils/utils";
import { ComponentRegistry } from "../../dynamic-components";
import { fileComponents } from "./file-components";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { FileDatatype } from "./file.datatype";
import { PhotoDatatype } from "./photo.datatype";

@NgModule({
  providers: [
    CouchdbFileService,
    MockFileService,
    serviceProvider(FileService, (injector: Injector) => {
      return hasRemoteSession(environment.session_type)
        ? injector.get(CouchdbFileService)
        : injector.get(MockFileService);
    }),
    { provide: DefaultDatatype, useClass: FileDatatype, multi: true },
    { provide: DefaultDatatype, useClass: PhotoDatatype, multi: true },
    // create the FileService eagerly: its constructor sets up the listener that deletes
    // the files of deleted records. Without this it is only created once a component
    // using files is rendered, so deleting a record from other parts of the app
    // (or right after startup) would leave its files behind.
    provideAppInitializer(() => void inject(FileService)),
  ],
})
export class FileModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(fileComponents);
  }
}
