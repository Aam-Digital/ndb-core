import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import {
  FlatTreeRow,
  flattenTree,
  insertChild,
  moveSubtree,
  rebuildTree,
  removeSubtree,
  updateRow,
} from "#src/app/utils/flat-tree/flat-tree";
import { ReportDefinitionDto } from "../report-config";
import { JsonEditorComponent } from "#src/app/core/admin/json-editor/json-editor.component";
import { SqlCodeEditorComponent } from "../edit-sql-query/sql-code-editor.component";
import {
  isGroupNode,
  newGroupNode,
  newQueryNode,
  ReportDefinitionUiNode,
  reportDefinitionTree,
  toReportDefinition,
  toUiNodes,
} from "./report-definition-ui-node";

/**
 * Structured editor for a SQL report's `reportDefinition` tree
 * (`{ query?, groupTitle?, items? }[]`, see {@link ReportDefinitionDto}).
 *
 * The tree is edited as a single flat, indented list (see `flat-tree`): each query is a
 * syntax-highlighted editor and each group a heading. Queries/groups are added directly into a
 * group via its "+" buttons, and any row can be dragged to a new position — dragging it sideways
 * nests it into the group above or lifts it back out, and dragging a group carries its whole
 * subtree. For non-"sql" modes the definition is edited as raw JSON.
 */
@DynamicComponent("EditReportDefinition")
@Component({
  selector: "app-edit-report-definition",
  templateUrl: "./edit-report-definition.component.html",
  styleUrl: "./edit-report-definition.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DragDropModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    JsonEditorComponent,
    SqlCodeEditorComponent,
  ],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditReportDefinitionComponent,
    },
  ],
})
export class EditReportDefinitionComponent
  extends CustomFormControlDirective<ReportDefinitionDto[]>
  implements EditComponent, OnInit
{
  private readonly destroyRef = inject(DestroyRef);

  formFieldConfig = input<FormFieldConfig>();

  /** the report's mode; the structured SQL editor is only used for "sql" reports */
  private readonly mode = signal<string | undefined>(undefined);
  readonly isSql = computed<boolean>(() => this.mode() === "sql");

  /** pixels of indentation per nesting level */
  readonly indentPerLevel = 24;

  /** the definition as a flat, indented list of rows (working copy) */
  private readonly flatRows = signal<FlatTreeRow<ReportDefinitionUiNode>[]>([]);

  /** the rows as rendered, with the display flags the template needs derived once per change */
  readonly rows = computed(() =>
    this.flatRows().map((row) => ({ ...row, isGroup: isGroupNode(row.data) })),
  );

  /** JSON of the last definition synced in either direction, to break the value<->rows loop */
  private lastSync = "";

  constructor() {
    super();

    // mirror external value changes (form load/reset) into the working rows
    effect(() => {
      const value = this.valueSignal();
      const arr = Array.isArray(value) ? value : [];
      const json = JSON.stringify(arr);
      if (json !== this.lastSync) {
        this.lastSync = json;
        this.flatRows.set(flattenTree(toUiNodes(arr), reportDefinitionTree));
      }
    });
  }

  ngOnInit() {
    // Track the report's mode (from the sibling form control) so the structured SQL editor
    // is only shown for "sql" reports; reporting/exporting definitions use the JSON editor.
    const modeControl = this.formControl?.parent?.get("mode");
    if (modeControl) {
      this.mode.set(modeControl.value);
      modeControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => this.mode.set(value));
    }
  }

  setQuery(index: number, query: string): void {
    this.updateNode(index, { query });
  }

  setGroupTitle(index: number, event: Event): void {
    const groupTitle = (event.target as HTMLInputElement).value;
    this.updateNode(index, { groupTitle });
  }

  addQuery(): void {
    this.append(newQueryNode());
  }

  addGroup(): void {
    this.append(newGroupNode());
  }

  /** add a query as the first child of the group at `groupIndex` */
  addChildQuery(groupIndex: number): void {
    this.insertInto(groupIndex, newQueryNode());
  }

  /** add a sub-group as the first child of the group at `groupIndex` */
  addChildGroup(groupIndex: number): void {
    this.insertInto(groupIndex, newGroupNode());
  }

  /** remove the row and, for a group, its whole subtree */
  remove(index: number): void {
    this.flatRows.update((rows) =>
      removeSubtree(rows, index, reportDefinitionTree),
    );
    this.persist();
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    // how far the row was dragged sideways determines how deep it is nested;
    // truncated, so that only a full indentation step re-nests (and not slight drift)
    const levelDelta = Math.trunc(event.distance.x / this.indentPerLevel);
    this.flatRows.update((rows) =>
      moveSubtree(
        rows,
        event.previousIndex,
        event.currentIndex,
        reportDefinitionTree,
        { levelDelta },
      ),
    );
    this.persist();
  }

  private append(node: ReportDefinitionUiNode): void {
    this.flatRows.update((rows) => [
      ...rows,
      { id: node.uniqueId, level: 0, data: node },
    ]);
    this.persist();
  }

  private insertInto(groupIndex: number, node: ReportDefinitionUiNode): void {
    this.flatRows.update((rows) =>
      insertChild(rows, groupIndex, node, reportDefinitionTree),
    );
    this.persist();
  }

  private updateNode(
    index: number,
    patch: Partial<ReportDefinitionUiNode>,
  ): void {
    this.flatRows.update((rows) =>
      updateRow(rows, index, { ...rows[index].data, ...patch }),
    );
    this.persist();
  }

  private persist(): void {
    const definition = toReportDefinition(
      rebuildTree(this.flatRows(), reportDefinitionTree),
    );
    const json = JSON.stringify(definition);
    // Ignore no-op writes: a re-emitted (unchanged) value would otherwise re-mark a pristine
    // form dirty. `lastSync` is the value last synced in either direction.
    if (json === this.lastSync) {
      return;
    }
    this.lastSync = json;
    // Mark dirty before writing the value: the form's `valueChanges` subscriber reads the
    // dirty state synchronously when `setValue` emits, so it must already be up to date.
    // Write through the bound FormControl directly: as a dynamically-created edit component
    // its `onChange` is never registered, so `this.value = …` would not reach the form.
    this.formControl?.markAsDirty();
    this.formControl?.setValue(definition);
  }
}
