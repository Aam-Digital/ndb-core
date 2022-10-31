import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FileService } from "./file.service";
import { EditFileComponent } from "./edit-file/edit-file.component";
import { ViewFileComponent } from "./view-file/view-file.component";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DownloadProgressComponent } from "./download-progress/download-progress.component";

@NgModule({
  declarations: [
    EditFileComponent,
    ViewFileComponent,
    DownloadProgressComponent,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    FontAwesomeModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  providers: [FileService],
})
export class FileModule {
  static dynamicComponents = [EditFileComponent, ViewFileComponent];
}
