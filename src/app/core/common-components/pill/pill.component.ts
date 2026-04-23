import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-pill",
  templateUrl: "./pill.component.html",
  styleUrls: ["./pill.component.scss"],
  standalone: true,
})
export class PillComponent {}
