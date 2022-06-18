import { Component, Input } from '@angular/core';
import { Child } from "../../model/child";

@Component({
  selector: 'app-child-block-tooltip',
  templateUrl: './child-block-tooltip.component.html',
  styleUrls: ['./child-block-tooltip.component.scss']
})
export class ChildBlockTooltipComponent {

  @Input() entity: Child;

}
