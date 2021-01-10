import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfigService } from "./config.service";
import { EntityModule } from "../entity/entity.module";

@NgModule({
  declarations: [],
  imports: [CommonModule, EntityModule],
  providers: [ConfigService],
})
export class ConfigModule {}
