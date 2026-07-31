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
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { v4 as uuid } from "uuid";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { ReportDefinitionDto } from "../report-config";
import { JsonEditorComponent } from "#src/app/core/admin/json-editor/json-editor.component";
import { EditReportGroupItemComponent } from "./edit-report-group-item.component";
import {
  groupNodeIds,
  ReportDefinitionUiNode,
  toReportDefinition,
  toUiNodes,
} from "./report-definition-ui-node";

/**
 * Structured editor for a SQL report's `reportDefinition` tree
 * (`{ query?, groupTitle?, items? }[]`, see {@link ReportDefinitionDto}).
 *
 * The tree is rendered recursively via {@link EditReportGroupItemComponent}: each query is a
 * syntax-highlighted editor and each group is a drop target, so queries and groups can be
 * added, removed, and dragged & dropped between any nesting level. For non-"sql" modes the
 * definition is edited as raw JSON instead.
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
    FontAwesomeModule,
    JsonEditorComponent,
    EditReportGroupItemComponent,
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

  /** id of the top-level drop list */
  readonly rootDropListId = "report-definition-root";

  /** working copy of the definition tree as UI nodes (carrying transient drag-drop ids) */
  readonly uiTree = signal<ReportDefinitionUiNode[]>([]);
  /** JSON of the last definition synced in either direction, to break the value<->tree loop */
  private lastSync = "";

  /** every drop target (root + all groups), so items can be dragged between any of them */
  readonly connectedDropLists = computed<string[]>(() =>
    [this.rootDropListId, ...groupNodeIds(this.uiTree())].reverse(),
  );

  constructor() {
    super();

    // mirror external value changes (form load/reset) into the working tree
    effect(() => {
      const value = this.valueSignal();
      const arr = Array.isArray(value) ? (value as ReportDefinitionDto[]) : [];
      const json = JSON.stringify(arr);
      if (json !== this.lastSync) {
        this.lastSync = json;
        this.uiTree.set(toUiNodes(arr));
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

  addQuery(): void {
    this.uiTree.update((tree) => [...tree, { uniqueId: uuid(), query: "" }]);
    this.persist();
  }

  addGroup(): void {
    this.uiTree.update((tree) => [
      ...tree,
      {
        uniqueId: uuid(),
        groupTitle: $localize`:ReportConfig:New group`,
        items: [],
      },
    ]);
    this.persist();
  }

  removeRoot(node: ReportDefinitionUiNode): void {
    this.uiTree.update((tree) =>
      tree.filter((n) => n.uniqueId !== node.uniqueId),
    );
    this.persist();
  }

  onRootChange(updated: ReportDefinitionUiNode): void {
    this.uiTree.update((tree) =>
      tree.map((n) => (n.uniqueId === updated.uniqueId ? updated : n)),
    );
    this.persist();
  }

  onDrop(event: CdkDragDrop<ReportDefinitionUiNode[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    // CdkDrag mutates the (nested) arrays in place; deep-clone to publish new references so
    // the recursive `node` inputs pick up the change, then persist the new structure.
    this.uiTree.set(structuredClone(this.uiTree()));
    this.persist();
  }

  private persist(): void {
    const definition = toReportDefinition(this.uiTree());
    const json = JSON.stringify(definition);
    // Ignore no-op writes: as the bound value reflows back into the tree (e.g. after a
    // save/reset), the recursive nodes re-emit their unchanged value, which would otherwise
    // re-mark a pristine form dirty. `lastSync` is the value last synced in either direction,
    // so an identical result means nothing actually changed.
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
