import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FileService } from "./file.service";
import { EditFileComponent } from "./edit-file/edit-file.component";
import { ViewFileComponent } from "./view-file/view-file.component";

@NgModule({
  declarations: [EditFileComponent, ViewFileComponent],
  imports: [CommonModule],
  providers: [FileService],
})
export class FileModule {
  static dynamicComponents = [EditFileComponent, ViewFileComponent];
}
