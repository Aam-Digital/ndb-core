import { Component, Inject, OnInit } from "@angular/core";
import { LoggingService } from "../../../logging/logging.service";
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
  constructor(
    private loggingService: LoggingService,
    @Inject(LOCATION_TOKEN) private location: Location,
  ) {}

  ngOnInit() {
    this.loggingService.warn(
      "Could not find component for route: " + this.location.pathname,
    );
  }
}
