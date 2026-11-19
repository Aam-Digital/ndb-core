import { Component, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { WHITEBOARD_COLORS, WhiteboardColor } from "../model/whiteboard-item";

/**
 * The "…" context menu shared by all items on a whiteboard.
 *
 * Project additional, item-specific entries through `<ng-content>`;
 * the generic actions (edit, colour, connect, remove) are emitted as events and handled by the board.
 */
@Component({
  selector: "app-whiteboard-item-menu",
  templateUrl: "./whiteboard-item-menu.component.html",
  styleUrl: "./whiteboard-item-menu.component.scss",
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    FaDynamicIconComponent,
  ],
})
export class WhiteboardItemMenuComponent {
  /** whether to offer the "edit text" action */
  editable = input(false);
  /** the current colour, if the item has one; enables the colour options */
  color = input<WhiteboardColor>();

  readonly edit = output<void>();
  readonly colorChange = output<WhiteboardColor>();
  readonly connect = output<void>();
  readonly remove = output<void>();

  readonly colors = WHITEBOARD_COLORS;
}
