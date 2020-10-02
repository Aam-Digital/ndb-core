import { APP_INITIALIZER, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterService } from "./router.service";
import { ConfigService } from "../config/config.service";
import { Router } from "@angular/router";
import { LoggingService } from "../logging/logging.service";

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class ViewModule {}
