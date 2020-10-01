import { Injectable } from "@angular/core";
import config from "./config-fix.json";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  static readonly PREFIX_VIEW_CONFIG = "view:";

  constructor() {}

  public async loadConfig() {
    return await new Promise((resolve) => {
      setTimeout(() => {
        console.log("config loaded"), resolve();
      }, 300);
    });
  }

  public getConfig<T>(id: string): T {
    console.log("config", config);
    return config[id];
  }
}
