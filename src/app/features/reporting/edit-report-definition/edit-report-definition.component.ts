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
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { v4 as uuid } from "uuid";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { ReportDefinitionDto } from "../report-config";
import { JsonEditorComponent } from "#src/app/core/admin/json-editor/json-editor.component";
import { SqlCodeEditorComponent } from "../edit-sql-query/sql-code-editor.component";
import {
  FlatReportRow,
  flattenTree,
  normalizeLevels,
  rebuildTree,
  subtreeLength,
  toReportDefinition,
  toUiNodes,
} from "./report-definition-ui-node";

/**
 * Structured editor for a SQL report's `reportDefinition` tree
 * (`{ query?, groupTitle?, items? }[]`, see {@link ReportDefinitionDto}).
 *
 * The tree is edited as a single flat, indented list ({@link FlatReportRow}): each query is a
 * syntax-highlighted editor and each group a heading. Queries/groups are added directly into a
 * group via its "+" buttons, and any row can be dragged to a new position — where it lands
 * determines its nesting (dropping it under a group nests it in that group), and dragging a
 * group carries its whole subtree. A single flat CdkDropList is used deliberately — nested drop
 * lists cannot reliably move items into/out of sub-groups. For non-"sql" modes the definition
 * is edited as raw JSON.
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
  readonly rows = signal<FlatReportRow[]>([]);
  /** JSON of the last definition synced in either direction, to break the value<->rows loop */
  private lastSync = "";

  constructor() {
    super();

    // mirror external value changes (form load/reset) into the working rows
    effect(() => {
      const value = this.valueSignal();
      const arr = Array.isArray(value) ? (value as ReportDefinitionDto[]) : [];
      const json = JSON.stringify(arr);
      if (json !== this.lastSync) {
        this.lastSync = json;
        this.rows.set(flattenTree(toUiNodes(arr)));
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
    this.updateRow(index, { query });
  }

  setGroupTitle(index: number, event: Event): void {
    const groupTitle = (event.target as HTMLInputElement).value;
    this.updateRow(index, { groupTitle });
  }

  addQuery(): void {
    this.rows.update((rows) => [
      ...rows,
      { uniqueId: uuid(), query: "", isGroup: false, level: 0 },
    ]);
    this.persist();
  }

  addGroup(): void {
    this.rows.update((rows) => [
      ...rows,
      {
        uniqueId: uuid(),
        groupTitle: $localize`:ReportConfig:New group`,
        isGroup: true,
        level: 0,
      },
    ]);
    this.persist();
  }

  /** add a query as the first child of the group at `groupIndex` */
  addChildQuery(groupIndex: number): void {
    this.insertChild(groupIndex, {
      uniqueId: uuid(),
      query: "",
      isGroup: false,
    });
  }

  /** add a sub-group as the first child of the group at `groupIndex` */
  addChildGroup(groupIndex: number): void {
    this.insertChild(groupIndex, {
      uniqueId: uuid(),
      groupTitle: $localize`:ReportConfig:New group`,
      isGroup: true,
    });
  }

  /** remove the row and, for a group, its whole subtree */
  remove(index: number): void {
    const rows = [...this.rows()];
    rows.splice(index, subtreeLength(rows, index));
    this.rows.set(normalizeLevels(rows));
    this.persist();
  }

  private insertChild(
    groupIndex: number,
    row: Omit<FlatReportRow, "level">,
  ): void {
    const rows = [...this.rows()];
    const level = rows[groupIndex].level + 1;
    rows.splice(groupIndex + 1, 0, { ...row, level });
    this.rows.set(normalizeLevels(rows));
    this.persist();
  }

  onDrop(event: CdkDragDrop<FlatReportRow[]>): void {
    const { previousIndex, currentIndex } = event;
    if (previousIndex === currentIndex) {
      return;
    }
    let rows = [...this.rows()];
    const len = subtreeLength(rows, previousIndex);
    const headerId = rows[previousIndex].uniqueId;
    // ids of the dragged group's descendants (empty for a query) — they must follow the header
    const childIds = rows
      .slice(previousIndex + 1, previousIndex + len)
      .map((r) => r.uniqueId);

    // move the dragged header to its new position, then pull its subtree back beneath it
    moveItemInArray(rows, previousIndex, currentIndex);
    if (childIds.length) {
      const children = rows.filter((r) => childIds.includes(r.uniqueId));
      rows = rows.filter((r) => !childIds.includes(r.uniqueId));
      const headerIndex = rows.findIndex((r) => r.uniqueId === headerId);
      rows.splice(headerIndex + 1, 0, ...children);
    }

    // nest according to the row now above the moved subtree, shifting the whole subtree with it
    const headerIndex = rows.findIndex((r) => r.uniqueId === headerId);
    const above = rows[headerIndex - 1];
    const targetLevel = !above
      ? 0
      : above.isGroup
        ? above.level + 1
        : above.level;
    const delta = targetLevel - rows[headerIndex].level;
    for (let i = headerIndex; i < headerIndex + len; i++) {
      rows[i] = { ...rows[i], level: rows[i].level + delta };
    }

    this.rows.set(normalizeLevels(rows));
    this.persist();
  }

  private updateRow(index: number, patch: Partial<FlatReportRow>): void {
    this.rows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
    this.persist();
  }

  private persist(): void {
    const definition = toReportDefinition(rebuildTree(this.rows()));
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
