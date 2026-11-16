import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Logging } from "../../../logging/logging.service";
import { LOCATION_TOKEN } from "../../../../utils/di-tokens";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ConfigService } from "../../config.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-not-found",
  templateUrl: "./not-found.component.html",
  styleUrls: ["./not-found.component.scss"],
  imports: [MatButtonModule, RouterLink],
})
export class NotFoundComponent implements OnInit {
  private location = inject<Location>(LOCATION_TOKEN);
  private configService = inject(ConfigService);

  isConfigReady: boolean = false;

  /** the config is missing because it could not be loaded, not because this system is new */
  configUnavailable: boolean = false;

  ngOnInit() {
    // If user is logged in and config is ready, allow the 404 message to show
    if (this.configService.hasConfig()) {
      this.isConfigReady = true;
    } else {
      this.configUnavailable = !this.configService.isSystemUninitialized();
    }

    if (!this.location.pathname.endsWith("/404")) {
      Logging.debug("Could not find route: " + this.location.pathname);
    }
  }
}
