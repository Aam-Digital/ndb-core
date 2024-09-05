import { Component, Inject, OnInit } from "@angular/core";
import { Logging } from "../../../logging/logging.service";
import { LOCATION_TOKEN } from "../../../../utils/di-tokens";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-not-found",
  templateUrl: "./not-found.component.html",
  styleUrls: ["./not-found.component.scss"],
  imports: [MatButtonModule, RouterLink],
  standalone: true,
})
export class NotFoundComponent implements OnInit {
  constructor(@Inject(LOCATION_TOKEN) private location: Location) {}

  ngOnInit() {
    if (!this.location.pathname.endsWith("/404")) {
      Logging.debug("Could not find route: " + this.location.pathname);
    }
  }
}
