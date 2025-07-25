import { Component, OnInit, inject } from "@angular/core";
import { Logging } from "../../../logging/logging.service";
import { LOCATION_TOKEN } from "../../../../utils/di-tokens";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ConfigService } from "../../config.service";

@Component({
  selector: "app-not-found",
  templateUrl: "./not-found.component.html",
  styleUrls: ["./not-found.component.scss"],
  imports: [MatButtonModule, RouterLink],
})
export class NotFoundComponent implements OnInit {
  private location = inject<Location>(LOCATION_TOKEN);
  private configService = inject(ConfigService);

  isConfigReady: boolean = false;

  ngOnInit() {
    // If user is logged in and config is ready, allow the 404 message to show
    if (this.configService.hasConfig()) {
      this.isConfigReady = true;
    }

    if (!this.location.pathname.endsWith("/404")) {
      Logging.debug("Could not find route: " + this.location.pathname);
    }
  }
}
