import { Component } from "@angular/core";
import { ComingSoonDialogService } from "../../../core/coming-soon/coming-soon-dialog.service";
import { RouteTarget } from "../../../app.routing";
import { ViewModule } from "../../../core/view/view.module";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@RouteTarget("AttendanceManager")
@Component({
  selector: "app-attendance-manager",
  templateUrl: "./attendance-manager.component.html",
  styleUrls: ["./attendance-manager.component.scss"],
  imports: [ViewModule, MatCardModule, MatButtonModule, RouterLink],
  standalone: true,
})
export class AttendanceManagerComponent {
  constructor(public comingSoonDialog: ComingSoonDialogService) {}
}
