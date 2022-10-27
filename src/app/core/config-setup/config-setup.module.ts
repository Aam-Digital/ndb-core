import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfigImportComponent } from "./config-import/config-import.component";
import { DataImportModule } from "../../features/data-import/data-import.module";
import { MatButtonModule } from "@angular/material/button";
import { ClipboardModule } from "@angular/cdk/clipboard";

@NgModule({
  declarations: [ConfigImportComponent],
  imports: [CommonModule, DataImportModule, MatButtonModule, ClipboardModule],
  exports: [ConfigImportComponent],
})
export class ConfigSetupModule {
  static dynamicComponents = [ConfigImportComponent];
}
