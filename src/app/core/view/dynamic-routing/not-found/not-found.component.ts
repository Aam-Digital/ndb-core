import { Component, Inject, OnInit } from "@angular/core";
import { LoggingService } from "../../../logging/logging.service";
import { LOCATION_TOKEN } from "../../../../utils/di-tokens";

@Component({
  selector: "app-not-found",
  templateUrl: "./not-found.component.html",
  styleUrls: ["./not-found.component.scss"],
})
export class NotFoundComponent implements OnInit {
  constructor(
    private loggingService: LoggingService,
    @Inject(LOCATION_TOKEN) private location: Location
  ) {}

  ngOnInit() {
    this.loggingService.warn(
      "Could not find component for route: " + this.location.pathname
    );
  }
}
