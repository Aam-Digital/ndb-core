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
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { ReportDefinitionDto } from "../report-config";
import { SqlCodeEditorComponent } from "../edit-sql-query/sql-code-editor.component";
import { JsonEditorComponent } from "#src/app/core/admin/json-editor/json-editor.component";

/** a flattened view of one node in the {@link ReportDefinitionDto} tree, for rendering */
interface FlatEntry {
  /** index path from the root array down to this node */
  path: number[];
  /** stable key for `@for` tracking (path-based, stable while structure is unchanged) */
  key: string;
  depth: number;
  kind: "group" | "query";
  query?: string;
  groupTitle?: string;
}

/**
 * Structured editor for a SQL report's `reportDefinition` tree
 * (`{ query?, groupTitle?, items? }[]`, see {@link ReportDefinitionDto}).
 *
 * Each query is edited in its own {@link SqlCodeEditorComponent} (syntax-highlighted),
 * groups show an editable title, and items can be added/removed. The recursive tree is
 * flattened for rendering and updated immutably by path, so no component self-recursion
 * is required and arbitrary nesting depth is supported.
 */
@DynamicComponent("EditReportDefinition")
@Component({
  selector: "app-edit-report-definition",
  templateUrl: "./edit-report-definition.component.html",
  styleUrl: "./edit-report-definition.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SqlCodeEditorComponent,
    JsonEditorComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
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

  /** working copy of the definition tree */
  private readonly tree = signal<ReportDefinitionDto[]>([]);
  /** JSON of the last value synced in either direction, to break the value<->tree loop */
  private lastSync = "";

  readonly entries = computed<FlatEntry[]>(() =>
    this.flatten(this.tree(), 0, []),
  );

  constructor() {
    super();

    // mirror external value changes (form load/reset) into the working tree
    effect(() => {
      const value = this.valueSignal();
      const arr = Array.isArray(value) ? value : [];
      const json = JSON.stringify(arr);
      if (json !== this.lastSync) {
        this.lastSync = json;
        this.tree.set(arr);
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

  // -- mutations -----------------------------------------------------------

  setQuery(path: number[], query: string): void {
    this.commit(
      this.mapAtPath(this.tree(), path, (item) => ({ ...item, query })),
    );
  }

  setGroupTitle(path: number[], event: Event): void {
    const groupTitle = (event.target as HTMLInputElement).value;
    this.commit(
      this.mapAtPath(this.tree(), path, (item) => ({ ...item, groupTitle })),
    );
  }

  remove(path: number[]): void {
    this.commit(this.removeAtPath(this.tree(), path));
  }

  addQuery(): void {
    this.commit([...this.tree(), { query: "" }]);
  }

  addGroup(): void {
    this.commit([
      ...this.tree(),
      { groupTitle: $localize`:ReportConfig:New group`, items: [] },
    ]);
  }

  // -- tree helpers --------------------------------------------------------

  private commit(next: ReportDefinitionDto[]): void {
    this.lastSync = JSON.stringify(next);
    this.tree.set(next);
    // Write through the bound FormControl directly: as a dynamically-created edit component
    // its `onChange` is never registered, so `this.value = …` would not reach the form and
    // the edit would be lost on save.
    this.formControl?.setValue(next);
    this.formControl?.markAsDirty();
  }

  private flatten(
    items: ReportDefinitionDto[],
    depth: number,
    parent: number[],
  ): FlatEntry[] {
    const out: FlatEntry[] = [];
    items.forEach((item, i) => {
      const path = [...parent, i];
      const key = path.join(".");
      if (Array.isArray(item.items)) {
        out.push({
          path,
          key,
          depth,
          kind: "group",
          groupTitle: item.groupTitle,
        });
        out.push(...this.flatten(item.items, depth + 1, path));
      } else {
        out.push({ path, key, depth, kind: "query", query: item.query });
      }
    });
    return out;
  }

  private mapAtPath(
    items: ReportDefinitionDto[],
    path: number[],
    update: (item: ReportDefinitionDto) => ReportDefinitionDto,
  ): ReportDefinitionDto[] {
    const [head, ...rest] = path;
    return items.map((item, i) => {
      if (i !== head) {
        return item;
      }
      return rest.length === 0
        ? update(item)
        : { ...item, items: this.mapAtPath(item.items ?? [], rest, update) };
    });
  }

  private removeAtPath(
    items: ReportDefinitionDto[],
    path: number[],
  ): ReportDefinitionDto[] {
    const [head, ...rest] = path;
    if (rest.length === 0) {
      return items.filter((_, i) => i !== head);
    }
    return items.map((item, i) =>
      i === head
        ? { ...item, items: this.removeAtPath(item.items ?? [], rest) }
        : item,
    );
  }
}
