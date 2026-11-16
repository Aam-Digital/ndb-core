import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { CdkDrag, CdkDragEnd } from "@angular/cdk/drag-drop";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "../../../core/entity/model/entity";
import {
  Point,
  Rect,
  connectRects,
  getBounds,
} from "../model/whiteboard-geometry";
import {
  WhiteboardColor,
  WhiteboardConnection,
  WhiteboardEntityItem,
  WhiteboardGroupItem,
  WhiteboardItem,
  WhiteboardNoteItem,
  WhiteboardPositionedItemType,
  isPositionedItem,
} from "../model/whiteboard-item";
import { WhiteboardEntityCardComponent } from "../whiteboard-entity-card/whiteboard-entity-card.component";
import { WhiteboardGroupComponent } from "../whiteboard-group/whiteboard-group.component";
import { WhiteboardMeasureDirective } from "../whiteboard-measure.directive";
import { WhiteboardNoteComponent } from "../whiteboard-note/whiteboard-note.component";

/** a connection with its computed line, ready to render */
export interface WhiteboardLine {
  connection: WhiteboardConnection;
  start: Point;
  end: Point;
  labelPosition: Point;
}

const ZOOM_STEP = 1.2;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
/** fallback until an item has been measured */
const DEFAULT_ITEM_SIZE = { width: 220, height: 60 };

/**
 * The pan- and zoomable surface of a whiteboard.
 *
 * Presentational: renders the given items and connections and emits the user's changes,
 * persistence is handled by the containing view.
 */
@Component({
  selector: "app-whiteboard-canvas",
  templateUrl: "./whiteboard-canvas.component.html",
  styleUrl: "./whiteboard-canvas.component.scss",
  imports: [
    CdkDrag,
    MatButtonModule,
    MatTooltipModule,
    FaDynamicIconComponent,
    WhiteboardEntityCardComponent,
    WhiteboardNoteComponent,
    WhiteboardGroupComponent,
    WhiteboardMeasureDirective,
  ],
  host: {
    "(keydown.escape)": "cancelConnecting()",
  },
})
export class WhiteboardCanvasComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  items = input<WhiteboardItem[]>([]);
  connections = input<WhiteboardConnection[]>([]);
  /** loaded records by prefixed id, for the entity cards */
  entities = input<Map<string, Entity>>(new Map());
  readonly = input(false);

  readonly itemChange = output<WhiteboardItem>();
  readonly itemRemove = output<WhiteboardItem>();
  /** the user wants to edit the text of a note, text, group or connection */
  readonly itemEdit = output<WhiteboardItem>();
  readonly connectionCreate = output<{
    fromItemId: string;
    toItemId: string;
  }>();
  readonly addLinkedRecords = output<WhiteboardEntityItem>();

  readonly pan = signal<Point>({ x: 40, y: 40 });
  readonly zoom = signal(1);
  readonly transform = computed(
    () =>
      `translate(${this.pan().x}px, ${this.pan().y}px) scale(${this.zoom()})`,
  );

  /** id of the item from which a new connection is being drawn */
  readonly connectingFrom = signal<string | undefined>(undefined);

  private readonly sizes = signal(
    new Map<string, { width: number; height: number }>(),
  );

  /** positioned items with groups first so they render behind the others */
  readonly positionedItems = computed(() => {
    const items = this.items().filter(isPositionedItem);
    return [
      ...items.filter((i) => i.type === "group"),
      ...items.filter((i) => i.type !== "group"),
    ];
  });

  readonly rects = computed(() => {
    const rects = new Map<string, Rect>();
    for (const item of this.positionedItems()) {
      rects.set(item.id, { x: item.x, y: item.y, ...this.getSize(item) });
    }
    return rects;
  });

  readonly lines = computed<WhiteboardLine[]>(() => {
    const rects = this.rects();
    return this.connections().flatMap((connection) => {
      const from = rects.get(connection.fromItemId);
      const to = rects.get(connection.toItemId);
      if (!from || !to) {
        return [];
      }
      const { start, end } = connectRects(from, to);
      return [
        {
          connection,
          start,
          end,
          labelPosition: {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
          },
        },
      ];
    });
  });

  /** accessible name of a card or annotation on the board */
  getItemLabel(item: WhiteboardPositionedItemType): string {
    switch (item.type) {
      case "entity":
        return (
          this.entities().get(item.entityId)?.toString() || $localize`Record`
        );
      case "note":
        return $localize`Note`;
      case "text":
        return $localize`Text`;
      case "group":
        return item.label
          ? $localize`Group: ${item.label}:label:`
          : $localize`Group`;
    }
  }

  /** accessible name of a line between two items */
  getLineLabel(line: WhiteboardLine): string {
    const label = line.connection.label;
    if (line.connection.isReference) {
      return label
        ? $localize`Reference: ${label}:label:`
        : $localize`Reference`;
    }
    return label
      ? $localize`Connection: ${label}:label:`
      : $localize`Connection`;
  }

  private panStart: { pointer: Point; pan: Point } | undefined;

  onSizeChange(itemId: string, size: { width: number; height: number }) {
    if (size.width === 0 && size.height === 0) {
      return;
    }
    this.sizes.update((sizes) => new Map(sizes).set(itemId, size));
  }

  onDragEnded(item: WhiteboardPositionedItemType, event: CdkDragEnd) {
    const { x, y } = event.source.getFreeDragPosition();
    if (x === item.x && y === item.y) {
      return;
    }
    this.itemChange.emit({ ...item, x: Math.round(x), y: Math.round(y) });
  }

  onResize(item: WhiteboardItem, size: { width: number; height: number }) {
    this.itemChange.emit({ ...item, ...size });
  }

  onColorChange(
    item: WhiteboardNoteItem | WhiteboardGroupItem,
    color: WhiteboardColor,
  ) {
    this.itemChange.emit({ ...item, color });
  }

  startConnecting(item: WhiteboardItem) {
    this.connectingFrom.set(item.id);
  }

  cancelConnecting() {
    this.connectingFrom.set(undefined);
  }

  /** while connecting, a click on an item completes the connection */
  onItemClick(item: WhiteboardItem) {
    const from = this.connectingFrom();
    if (!from) {
      return;
    }
    if (from !== item.id) {
      this.connectionCreate.emit({ fromItemId: from, toItemId: item.id });
    }
    this.cancelConnecting();
  }

  /** the centre of the visible area, in board coordinates */
  getViewportCenter(): Point {
    const viewport = this.elementRef.nativeElement.getBoundingClientRect();
    return this.toBoardPoint({
      x: viewport.width / 2,
      y: viewport.height / 2,
    });
  }

  getItemRects(): Rect[] {
    return Array.from(this.rects().values());
  }

  zoomIn() {
    this.zoomAround(this.zoom() * ZOOM_STEP, this.getViewportPixelCenter());
  }

  zoomOut() {
    this.zoomAround(this.zoom() / ZOOM_STEP, this.getViewportPixelCenter());
  }

  /** pan and zoom so that all items are visible */
  fitToContent() {
    const bounds = getBounds(this.getItemRects());
    const viewport = this.elementRef.nativeElement.getBoundingClientRect();
    if (!bounds || viewport.width === 0) {
      this.pan.set({ x: 40, y: 40 });
      this.zoom.set(1);
      return;
    }
    const padding = 40;
    const width = bounds.maxX - bounds.minX + 2 * padding;
    const height = bounds.maxY - bounds.minY + 2 * padding;
    const zoom = Math.min(
      1,
      Math.max(
        MIN_ZOOM,
        Math.min(viewport.width / width, viewport.height / height),
      ),
    );
    this.zoom.set(zoom);
    this.pan.set({
      x: (viewport.width - (bounds.maxX + bounds.minX) * zoom) / 2,
      y: (viewport.height - (bounds.maxY + bounds.minY) * zoom) / 2,
    });
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const factor = Math.exp(-event.deltaY * 0.002);
      this.zoomAround(this.zoom() * factor, this.toViewportPixel(event));
    } else {
      this.pan.update((p) => ({
        x: p.x - event.deltaX,
        y: p.y - event.deltaY,
      }));
    }
  }

  onBackgroundPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement;
    if (!target.classList.contains("pan-area")) {
      return; // started on an item
    }
    this.cancelConnecting();
    this.panStart = {
      pointer: { x: event.clientX, y: event.clientY },
      pan: this.pan(),
    };
    target.setPointerCapture(event.pointerId);
  }

  onBackgroundPointerMove(event: PointerEvent) {
    if (!this.panStart) {
      return;
    }
    this.pan.set({
      x: this.panStart.pan.x + event.clientX - this.panStart.pointer.x,
      y: this.panStart.pan.y + event.clientY - this.panStart.pointer.y,
    });
  }

  onBackgroundPointerUp() {
    this.panStart = undefined;
  }

  private getSize(item: WhiteboardPositionedItemType) {
    if (item.type === "note" || item.type === "group") {
      return {
        width: item.width,
        height: Math.max(item.height, this.sizes().get(item.id)?.height ?? 0),
      };
    }
    return this.sizes().get(item.id) ?? DEFAULT_ITEM_SIZE;
  }

  /** zoom while keeping the board point under the given viewport pixel in place */
  private zoomAround(newZoom: number, viewportPixel: Point) {
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    const boardPoint = this.toBoardPoint(viewportPixel);
    this.zoom.set(zoom);
    this.pan.set({
      x: viewportPixel.x - boardPoint.x * zoom,
      y: viewportPixel.y - boardPoint.y * zoom,
    });
  }

  private getViewportPixelCenter(): Point {
    const viewport = this.elementRef.nativeElement.getBoundingClientRect();
    return { x: viewport.width / 2, y: viewport.height / 2 };
  }

  private toViewportPixel(event: { clientX: number; clientY: number }): Point {
    const viewport = this.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - viewport.left,
      y: event.clientY - viewport.top,
    };
  }

  private toBoardPoint(viewportPixel: Point): Point {
    const zoom = this.zoom();
    return {
      x: (viewportPixel.x - this.pan().x) / zoom,
      y: (viewportPixel.y - this.pan().y) / zoom,
    };
  }
}
