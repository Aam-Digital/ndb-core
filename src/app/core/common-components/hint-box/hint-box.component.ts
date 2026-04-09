import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-hint-box",
  imports: [],
  templateUrl: "./hint-box.component.html",
  styleUrl: "./hint-box.component.scss",
})
export class HintBoxComponent {}
