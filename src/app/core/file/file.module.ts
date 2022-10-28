import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FileService } from "./file.service";
import { EditFileComponent } from "./edit-file/edit-file.component";
import { ViewFileComponent } from "./view-file/view-file.component";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [EditFileComponent, ViewFileComponent],
  imports: [CommonModule, MatButtonModule, FontAwesomeModule],
  providers: [FileService],
})
export class FileModule {
  static dynamicComponents = [EditFileComponent, ViewFileComponent];
}
