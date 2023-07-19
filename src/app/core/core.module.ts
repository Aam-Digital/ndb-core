import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { coreComponents } from "./core-components";
import { User } from "./user/user";
import { Config } from "./config/config";

@NgModule({})
export class CoreModule {
  static databaseEntities = [User, Config];

  constructor(components: ComponentRegistry) {
    components.addAll(coreComponents);
  }
}
