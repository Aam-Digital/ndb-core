import { Component, Inject, OnInit } from "@angular/core";
import { Logging } from "../logging/logging.service";
import { LOCATION_TOKEN } from "../../utils/di-tokens";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-entity-not-found",
  templateUrl: "./entity-not-found.component.html",
  styleUrls: ["./entity-not-found.component.scss"],
  imports: [MatButtonModule, RouterLink],
  standalone: true,
})
export class EntityNotFoundComponent implements OnInit {
  constructor(@Inject(LOCATION_TOKEN) private location: Location) {}

  ngOnInit() {
    if (!this.location.pathname.endsWith("/entity-not-found")) {
      Logging.debug("Could not find entity ID: " + this.location.pathname);
    }
  }
}