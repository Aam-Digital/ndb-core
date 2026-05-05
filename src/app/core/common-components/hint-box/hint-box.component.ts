import { Component, ChangeDetectionStrategy, Input } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-hint-box",
  imports: [],
  templateUrl: "./hint-box.component.html",
  styleUrl: "./hint-box.component.scss",
  host: { "[attr.type]": "type" },
})
export class HintBoxComponent {
  @Input() type: "info" | "warning" = "info";
}
