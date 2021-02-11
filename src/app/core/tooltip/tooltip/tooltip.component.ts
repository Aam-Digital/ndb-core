import { ChangeDetectionStrategy, Component, HostBinding } from "@angular/core";
import { animate, style, transition, trigger } from "@angular/animations";

@Component({
  template: `<div>{{ text }}</div>`,
  styleUrls: ["./tooltip.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("tooltip", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate(300, style({ opacity: 1 })),
      ]),
      transition(":leave", [animate(300, style({ opacity: 0 }))]),
    ]),
  ],
})
export class TooltipComponent {
  @HostBinding("@tooltip") public tooltip = true;
  public text: string;
}
