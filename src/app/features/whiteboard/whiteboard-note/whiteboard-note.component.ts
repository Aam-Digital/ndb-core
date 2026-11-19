import { Component, computed, input, output } from "@angular/core";
import {
  WhiteboardColor,
  WhiteboardNoteItem,
  WhiteboardTextItem,
} from "../model/whiteboard-item";
import { WhiteboardItemMenuComponent } from "../whiteboard-item-menu/whiteboard-item-menu.component";

/**
 * A sticky note or a plain text label on the whiteboard.
 */
@Component({
  selector: "app-whiteboard-note",
  templateUrl: "./whiteboard-note.component.html",
  styleUrl: "./whiteboard-note.component.scss",
  imports: [WhiteboardItemMenuComponent],
})
export class WhiteboardNoteComponent {
  item = input.required<WhiteboardNoteItem | WhiteboardTextItem>();
  readonly = input(false);

  readonly edit = output<void>();
  readonly colorChange = output<WhiteboardColor>();
  readonly connect = output<void>();
  readonly remove = output<void>();

  readonly note = computed(() => {
    const item = this.item();
    return item.type === "note" ? item : undefined;
  });

  readonly placeholder = $localize`(empty note)`;
}
