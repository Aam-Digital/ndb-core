import { Injector, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CouchdbFileService } from "./couchdb-file.service";
import { EditFileComponent } from "./edit-file/edit-file.component";
import { ViewFileComponent } from "./view-file/view-file.component";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from "@angular/material/legacy-progress-spinner";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatRippleModule } from "@angular/material/core";
import { ShowFileComponent } from "./show-file/show-file.component";
import { environment } from "../../../environments/environment";
import { SessionType } from "../../core/session/session-type";
import { FileService } from "./file.service";
import { MockFileService } from "./mock-file.service";
import { serviceProvider } from "../../utils/utils";
import { ProgressComponent } from "./progress/progress.component";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { fileDataType } from "./file-data-type";

@NgModule({
  declarations: [
    EditFileComponent,
    ViewFileComponent,
    ShowFileComponent,
    ProgressComponent,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    FontAwesomeModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatRippleModule,
  ],
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
  static dynamicComponents = [EditFileComponent, ViewFileComponent];

  constructor(entitySchemaService: EntitySchemaService) {
    entitySchemaService.registerSchemaDatatype(fileDataType);
  }
}
