import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from "@angular/core";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { v4 as uuid } from "uuid";
import { SqlCodeEditorComponent } from "../edit-sql-query/sql-code-editor.component";
import {
  isGroupNode,
  ReportDefinitionUiNode,
} from "./report-definition-ui-node";

/**
 * Renders one node of a SQL report definition — either a query (syntax-highlighted
 * {@link SqlCodeEditorComponent}) or a group. Groups recurse into this same component for
 * their children and act as drop targets, so queries and groups can be dragged & dropped
 * between any nesting level. Structural drop events bubble up to the host, which owns the tree.
 */
@Component({
  selector: "app-edit-report-group-item",
  templateUrl: "./edit-report-group-item.component.html",
  styleUrl: "./edit-report-group-item.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    SqlCodeEditorComponent,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
})
export class EditReportGroupItemComponent {
  node = model.required<ReportDefinitionUiNode>();
  connectedTo = input<string[]>([]);
  enabled = input<boolean>(true);

  /** bubble a drag & drop event up to the host, which owns and persists the whole tree */
  itemDrop = output<CdkDragDrop<ReportDefinitionUiNode[]>>();
  /** ask the parent to remove this node */
  deleteItem = output<void>();

  readonly isGroup = computed<boolean>(() => isGroupNode(this.node()));

  setQuery(query: string): void {
    this.node.set({ ...this.node(), query });
  }

  setGroupTitle(event: Event): void {
    const groupTitle = (event.target as HTMLInputElement).value;
    this.node.set({ ...this.node(), groupTitle });
  }

  addQuery(): void {
    this.node.set({
      ...this.node(),
      items: [...(this.node().items ?? []), { uniqueId: uuid(), query: "" }],
    });
  }

  addSubGroup(): void {
    this.node.set({
      ...this.node(),
      items: [
        ...(this.node().items ?? []),
        {
          uniqueId: uuid(),
          groupTitle: $localize`:ReportConfig:New group`,
          items: [],
        },
      ],
    });
  }

  removeChild(child: ReportDefinitionUiNode): void {
    this.node.set({
      ...this.node(),
      items: this.node().items.filter(
        (item) => item.uniqueId !== child.uniqueId,
      ),
    });
  }

  onChildChange(updated: ReportDefinitionUiNode): void {
    this.node.set({
      ...this.node(),
      items: this.node().items.map((item) =>
        item.uniqueId === updated.uniqueId ? updated : item,
      ),
    });
  }
}
