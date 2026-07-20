import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { sql } from "@codemirror/lang-sql";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";

/**
 * Edit a single SQL query string with CodeMirror 6 syntax highlighting.
 *
 * Works both as a form-field `editComponent` (bound via `ngControl`) and standalone via
 * `[value]` / `(valueChange)` (used by {@link EditReportDefinitionComponent} for each query).
 */
@DynamicComponent("EditSqlQuery")
@Component({
  selector: "app-edit-sql-query",
  template: `<div #editor class="sql-code-editor"></div>`,
  styleUrl: "./sql-code-editor.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: MatFormFieldControl, useExisting: SqlCodeEditorComponent },
  ],
})
export class SqlCodeEditorComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, AfterViewInit, OnDestroy
{
  formFieldConfig = input<FormFieldConfig>();

  private readonly editorHost =
    viewChild.required<ElementRef<HTMLDivElement>>("editor");
  private editor?: EditorView;
  private readonly editable = new Compartment();
  /** guards the update listener from echoing programmatic (external) doc updates */
  private applyingExternalValue = false;

  constructor() {
    super();

    // push external value changes (form load/reset, [value] binding) into the editor
    effect(() => {
      const value = this.valueSignal() ?? "";
      const editor = this.editor;
      if (!editor) {
        return;
      }
      const current = editor.state.doc.toString();
      if (value !== current) {
        this.applyingExternalValue = true;
        editor.dispatch({
          changes: { from: 0, to: current.length, insert: value },
        });
        this.applyingExternalValue = false;
      }
    });

    // reflect the enabled/disabled state in the editor
    effect(() => {
      const enabled = this.enabled();
      this.editor?.dispatch({
        effects: this.editable.reconfigure(EditorView.editable.of(enabled)),
      });
    });
  }

  ngAfterViewInit(): void {
    const state = EditorState.create({
      doc: this.valueSignal() ?? "",
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        sql(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        this.editable.of(EditorView.editable.of(this.enabled())),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.applyingExternalValue) {
            this.value = update.state.doc.toString();
          }
        }),
      ],
    });

    this.editor = new EditorView({
      state,
      parent: this.editorHost().nativeElement,
    });
  }

  override ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = undefined;
    super.ngOnDestroy();
  }
}
