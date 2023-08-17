import { Component } from "@angular/core";
import { ComingSoonDialogService } from "../../../core/coming-soon/coming-soon-dialog.service";
import { RouteTarget } from "../../../app.routing";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ViewTitleComponent } from "../../../core/entity-components/utils/view-title/view-title.component";

@RouteTarget("AttendanceManager")
@Component({
  selector: "app-attendance-manager",
  templateUrl: "./attendance-manager.component.html",
  styleUrls: ["./attendance-manager.component.scss"],
  imports: [MatCardModule, MatButtonModule, RouterLink, ViewTitleComponent],
  standalone: true,
})
export class AttendanceManagerComponent {
  constructor(public comingSoonDialog: ComingSoonDialogService) {}
}
