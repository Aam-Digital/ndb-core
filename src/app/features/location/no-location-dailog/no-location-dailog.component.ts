import { Component } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-no-location-dailog",
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: "./no-location-dailog.component.html",
  styleUrl: "./no-location-dailog.component.scss",
})
export class NoLocationDailogComponent {}
