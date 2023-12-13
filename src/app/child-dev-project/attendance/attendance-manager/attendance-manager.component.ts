import { Component } from "@angular/core";
import { ComingSoonDialogService } from "../../../features/coming-soon/coming-soon-dialog.service";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { RouteTarget } from "../../../route-target";

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
