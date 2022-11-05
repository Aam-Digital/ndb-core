import { Injector, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CouchdbFileService } from "./couchdb-file.service";
import { EditFileComponent } from "./edit-file/edit-file.component";
import { ViewFileComponent } from "./view-file/view-file.component";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatRippleModule } from "@angular/material/core";
import { ShowFileComponent } from "./show-file/show-file.component";
import { environment } from "../../../environments/environment";
import { SessionType } from "../session/session-type";
import { FileService } from "./file.service";
import { MockFileService } from "./mock-file.service";

@NgModule({
  declarations: [EditFileComponent, ViewFileComponent, ShowFileComponent],
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
    {
      provide: FileService,
      useFactory: (injector: Injector) => {
        if (environment.session_type === SessionType.synced) {
          return injector.get(CouchdbFileService);
        } else {
          return injector.get(MockFileService);
        }
      },
      deps: [Injector],
    },
  ],
})
export class FileModule {
  static dynamicComponents = [EditFileComponent, ViewFileComponent];
}
