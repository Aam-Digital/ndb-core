import { Component } from "@angular/core";
import { RouteTarget } from "../../../app.routing";
import {
  InputFileComponent,
  ParsedData,
} from "../../../core/common-components/input-file/input-file.component";
import { ConfigImportParserService } from "../config-import-parser.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { ClipboardModule } from "@angular/cdk/clipboard";

/**
 * UI to upload a config definition and generate a new app `Config` from the imported file.
 */
@RouteTarget("ConfigImport")
@Component({
  selector: "app-config-import",
  templateUrl: "./config-import.component.html",
  styleUrls: ["./config-import.component.scss"],
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    ClipboardModule,
    InputFileComponent,
  ],
  standalone: true,
})
export class ConfigImportComponent {
  loadedConfigFile: any;
  entityName: string = "Child";
  generatedConfig: string = "";

  constructor(private configImportParser: ConfigImportParserService) {}

  loadData(loadedConfigFile: ParsedData) {
    // TODO: handle csv parse errors
    // TODO: validate the data has the expected structure
    this.loadedConfigFile = loadedConfigFile.data;
  }

  generateConfig(includingDefaultConfigs: boolean) {
    this.generatedConfig = JSON.stringify(
      this.configImportParser.parseImportDefinition(
        this.loadedConfigFile,
        this.entityName,
        includingDefaultConfigs,
      ),
      null,
      2,
    );
  }
}
