import { Component } from "@angular/core";
import { RouteTarget } from "../../../app.routing";
import { ParsedData } from "../../../features/data-import/input-file/input-file.component";
import { ConfigImportParserService } from "../config-import-parser.service";

/**
 * UI to upload a config definition and generate a new app `Config` from the imported file.
 */
@RouteTarget("ConfigImport")
@Component({
  selector: "app-config-import",
  templateUrl: "./config-import.component.html",
  styleUrls: ["./config-import.component.scss"],
})
export class ConfigImportComponent {
  generatedConfig: any;

  constructor(private configImportParser: ConfigImportParserService) {}

  loadData(loadedConfigFile: ParsedData) {
    // TODO: handle csv parse errors
    // TODO: validate the data has the expected structure
    this.generatedConfig = JSON.stringify(
      this.configImportParser.parseImportDefinition(
        loadedConfigFile.data,
        "Child" // TODO
      ),
      null,
      2
    );
  }

  saveConfig() {
    throw new Error("not implemented yet");
  }
}
