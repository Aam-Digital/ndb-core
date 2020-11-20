import { Injectable } from "@angular/core";
import config from "./config-fix.json";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  constructor() {}

  public async loadConfig() {
    return await new Promise((resolve) => {
      setTimeout(() => {
        console.log("config loaded");
        resolve();
      }, 300);
    });
  }

  public getConfig<T>(id: string): T {
    return config[id];
  }

  public getAllConfigs<T>(prefix: string): T[] {
    const matchingConfigs = [];

    for (const id of Object.keys(config)) {
      if (id.startsWith(prefix)) {
        config[id]._id = id;
        matchingConfigs.push(config[id]);
      }
    }

    return matchingConfigs;
  }
}
