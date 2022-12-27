import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfigImportComponent } from "./config-import/config-import.component";
import { DataImportModule } from "../../features/data-import/data-import.module";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [ConfigImportComponent],
  imports: [
    CommonModule,
    DataImportModule,
    MatButtonModule,
    ClipboardModule,
    MatInputModule,
    FormsModule,
  ],
  exports: [ConfigImportComponent],
})
export class ConfigSetupModule {
  static dynamicComponents = [ConfigImportComponent];
}
