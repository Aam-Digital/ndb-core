import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CloudFileService } from "./cloud-file-service.service";
import { CloudFileServiceUserSettingsComponent } from "./cloud-file-service-user-settings/cloud-file-service-user-settings.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { AppConfig } from "../app-config/app-config";

/**
 * Provides cloud file storage integration with platforms like Nextcloud.
 * Configuration is described in the main README.
 */
@NgModule({
  declarations: [CloudFileServiceUserSettingsComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  providers: [CloudFileService],
  exports: [CloudFileServiceUserSettingsComponent],
})
export class WebdavModule {
  static get isEnabled(): boolean {
    return CloudFileService.WEBDAV_ENABLED;
  }
}
