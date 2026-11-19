import { Component, input, output } from "@angular/core";
import { WhiteboardColor, WhiteboardGroupItem } from "../model/whiteboard-item";
import { WhiteboardItemMenuComponent } from "../whiteboard-item-menu/whiteboard-item-menu.component";

const MIN_GROUP_SIZE = 80;

/**
 * A titled, resizable rectangle to visually group items on the whiteboard.
 */
@Component({
  selector: "app-whiteboard-group",
  templateUrl: "./whiteboard-group.component.html",
  styleUrl: "./whiteboard-group.component.scss",
  imports: [WhiteboardItemMenuComponent],
})
export class WhiteboardGroupComponent {
  item = input.required<WhiteboardGroupItem>();
  readonly = input(false);
  /** current zoom of the canvas, to translate pointer movement into board units while resizing */
  zoom = input(1);

  readonly edit = output<void>();
  readonly colorChange = output<WhiteboardColor>();
  readonly connect = output<void>();
  readonly remove = output<void>();
  readonly resize = output<{ width: number; height: number }>();

  readonly placeholder = $localize`(untitled group)`;

  startResize(event: PointerEvent) {
    if (this.readonly()) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const handle = event.target as HTMLElement;
    const start = { x: event.clientX, y: event.clientY };
    const { width, height } = this.item();

    const onMove = (move: PointerEvent) => {
      const zoom = this.zoom() || 1;
      this.resize.emit({
        width: Math.max(
          MIN_GROUP_SIZE,
          Math.round(width + (move.clientX - start.x) / zoom),
        ),
        height: Math.max(
          MIN_GROUP_SIZE,
          Math.round(height + (move.clientY - start.y) / zoom),
        ),
      });
    };
    const onEnd = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  }
}
