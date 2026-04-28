import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ContentChild,
  DestroyRef,
  ElementRef,
  EventEmitter,
  input,
  Input,
  inject,
  OnChanges,
  OnInit,
  Output,
  signal,
  TemplateRef,
  TrackByFunction,
  ViewChild,
  WritableSignal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NgTemplateOutlet } from "@angular/common";
import {
  MAT_FORM_FIELD,
  MatFormFieldControl,
} from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatInput, MatInputModule } from "@angular/material/input";
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { auditTime, filter, map, startWith } from "rxjs/operators";
import { CustomFormControlDirective } from "./custom-form-control.directive";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import {
  MatChipGrid,
  MatChipInput,
  MatChipRemove,
  MatChipRow,
} from "@angular/material/chips";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ViewportRuler,
} from "@angular/cdk/scrolling";
import { EMPTY, fromEvent, merge } from "rxjs";

/**
 * Configuration for a single "Add new [label]" entry in the autocomplete dropdown.
 * Pass an array of these via `[createOptions]` to show one create option per entity type.
 */
export interface CreateOptionConfig<O> {
  /** Label shown in the dropdown, e.g. the entity type's human-readable name */
  label: string;
  /** Called when the user selects this option; should open a creation form and return the new entity */
  create: (input: string) => Promise<O>;
}

interface CreateOptionMarker<O> {
  __createOptionConfig: CreateOptionConfig<O>;
  __input: string;
}

interface SelectableOption<O, V> {
  initial: O;
  asString: string;
  asValue: V;
  selected: boolean;
  isHidden: boolean;
  isInvalid?: boolean;
  isEmpty?: boolean;
}

export const BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS = [
  ReactiveFormsModule,
  MatInputModule,
  MatAutocompleteModule,
  MatCheckboxModule,
  NgTemplateOutlet,
  MatChipInput,
  MatChipGrid,
  MatChipRow,
  FaIconComponent,
  MatTooltip,
  MatChipRemove,
  DragDropModule,
  CdkVirtualScrollViewport,
  CdkVirtualForOf,
  CdkFixedSizeVirtualScroll,
];

/**
 * Custom `MatFormFieldControl` for any select / dropdown field.
 */
@Component({
  selector: "app-basic-autocomplete",
  templateUrl: "basic-autocomplete.component.html",
  styleUrls: ["./basic-autocomplete.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatFormFieldControl, useExisting: BasicAutocompleteComponent },
    {
      provide: MAT_FORM_FIELD,
      useFactory: () =>
        inject(MAT_FORM_FIELD, { optional: true, skipSelf: true }),
    },
  ],
  imports: BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
})
export class BasicAutocompleteComponent<O, V = O>
  extends CustomFormControlDirective<V | V[]>
  implements OnChanges, OnInit, AfterViewInit
{
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewportRuler = inject(ViewportRuler);

  @ContentChild(TemplateRef) templateRef: TemplateRef<any>;
  // `_elementRef` is protected in `MapInput`
  @ViewChild(MatInput, { static: true }) inputElement: MatInput & {
    _elementRef: ElementRef<HTMLElement>;
  };
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;
  @ViewChild(CdkVirtualScrollViewport)
  virtualScrollViewport: CdkVirtualScrollViewport;

  @Input() valueMapper = (option: O) =>
    option?.["_id"] ?? (option as unknown as V);
  @Input() optionToString = (option: O) =>
    option?.["_label"] ?? option?.toString();
  /** @deprecated Prefer `createOptions` to support one unified create flow. */
  @Input() createOption: (input: string) => Promise<O>;
  @Input() createOptions: CreateOptionConfig<O>[] = [];
  @Input() hideOption: (option: O) => boolean = () => false;

  /**
   * Used in template to display the "Add new" option label.
   * Delegates to optionToString so callers with a custom optionToString (e.g. showing
   * an example date) get a preview in the "Add new" option too.
   * Falls back to the raw input when optionToString throws or returns null/undefined
   * (e.g. when O is an object type whose properties don't exist on a plain string).
   */
  protected createOptionDisplay(input: string): string {
    try {
      return this.optionToString(input as unknown as O) ?? input;
    } catch {
      return input;
    }
  }

  protected get availableCreateOptions(): CreateOptionConfig<O>[] {
    if (this.createOptions.length > 0) {
      return this.createOptions;
    }
    if (!this.createOption) {
      return [];
    }

    return [{ label: "", create: this.createOption }];
  }

  protected createOptionLabel(
    option: CreateOptionConfig<O>,
    input: string,
  ): string {
    return option.label || this.createOptionDisplay(input);
  }

  protected createOptionAriaLabel(
    option: CreateOptionConfig<O>,
    input: string,
  ): string {
    return $localize`:ARIA label for adding an option in a dropdown:Add new ${this.createOptionLabel(
      option,
      input,
    )}`;
  }

  /**
   * Whether the user should be able to select multiple values.
   */
  @Input() multi?: boolean;

  /**
   * Whether the user can manually drag & drop to reorder the selected items
   */
  @Input() reorder?: boolean;

  autocompleteOptions: WritableSignal<SelectableOption<O, V>[]> = signal([]);
  autocompleteForm = new FormControl("");
  autocompleteSuggestedOptions = this.autocompleteForm.valueChanges.pipe(
    filter((val) => typeof val === "string"),
    map((val) => this.updateAutocomplete(val)),
    startWith([] as SelectableOption<O, V>[]),
  );
  autocompleteFilterFunction: (option: O) => boolean;
  @Output() autocompleteFilterChange = new EventEmitter<(o: O) => boolean>();

  /** whether the "add new" option is logically allowed in the current context (e.g. not creating a duplicate) */
  showAddOption = signal(false);

  /**
   * Dynamic width of the autocomplete dropdown panel.
   * Set to match the full width of the Material form field container (including icons/padding).
   */
  panelWidth = signal("200px");

  /**
   * Maximum number of options to display in the dropdown.
   * If more options match the current filter, a hint is shown to type to narrow results.
   * Set to 0 for no limit. Defaults to 100.
   */
  @Input() maxOptionsToDisplay: number = 100;
  hasMoreOptions = signal(false);

  /**
   * Whether dropdown option labels should be shown in full length.
   * Set to false to truncate labels with ellipsis.
   */
  displayFullLengthOptionLabel = input(false);

  get displayText() {
    const values: V[] = Array.isArray(this.value) ? this.value : [this.value];

    return values
      .map(
        (v) =>
          this._options.find((o) => this.compareEnumValues(o.asValue, v))
            ?.asString,
      )
      .join(", ");
  }

  override get disabled(): boolean {
    return this._disabled;
  }

  override set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled
      ? this.autocompleteForm.disable()
      : this.autocompleteForm.enable();
    this.stateChanges.next();
  }

  /**
   * The options to display in the autocomplete dropdown.
   * If you pass complex objects here, you can customize what value is displayed and what value is output/stored
   * by overriding the `valueMapper` and `optionToString` methods via inputs.
   * By default, the "_id" property is used as the value and the "_label" property or `toString()` method as the display value.
   *
   * @param options Array of available options (can be filtered further by the `hideOption` function)
   */
  @Input() set options(options: O[]) {
    this._options = options.map((o) => this.toSelectableOption(o));
  }

  private _options: SelectableOption<O, V>[] = [];

  _selectedOptions = signal<SelectableOption<O, V>[]>([]);

  /**
   * Keep the search value to help users quickly multi-select multiple related options without having to type filter text again
   */
  retainSearchValue: string;

  /**
   * Display the selected items as simple text, as chips or not at all (if used in combination with another component)
   */
  @Input() display: "text" | "chips" | "none" = "text";

  /**
   * display the search input rather than the selected elements only
   * (when the form field gets focused).
   */
  isInSearchMode: WritableSignal<boolean> = signal(false);
  trackByOptionValueFn: TrackByFunction<SelectableOption<O, V>> | undefined = (
    i,
    o,
  ) => o?.asValue;

  /**
   * Height of the virtual scroll viewport, capped to fit within the panel.
   * Material's default panel max-height is 256px. We reserve space for footer elements
   * ("type to filter" hint, "show inactive" toggle, padding) and cap the viewport accordingly
   * so that virtual scrolling actually virtualizes (instead of rendering all items).
   */
  private static readonly PANEL_MAX_HEIGHT = 256;
  private static readonly FOOTER_RESERVE = 56;
  viewportHeight = computed(() => {
    const contentHeight = (this.autocompleteOptions()?.length ?? 0) * 48;
    const availableHeight =
      BasicAutocompleteComponent.PANEL_MAX_HEIGHT -
      BasicAutocompleteComponent.FOOTER_RESERVE;
    return Math.min(contentHeight, availableHeight);
  });

  ngOnInit() {
    this.autocompleteSuggestedOptions.subscribe((options) => {
      this.autocompleteOptions.set(options);
      setTimeout(() => {
        this.virtualScrollViewport?.checkViewportSize();
      });
    });
    // Subscribe to the valueChanges observable to print the input value
    this.autocompleteForm.valueChanges.subscribe((value) => {
      if (
        typeof value === "string" &&
        (this.display !== "text" || value !== this.displayText)
      ) {
        this.retainSearchValue = value;
      }
    });
  }

  ngOnChanges(changes: { [key in keyof this]?: any }) {
    if (changes.valueMapper) {
      this._options.forEach(
        (opt) => (opt.asValue = this.valueMapper(opt.initial)),
      );
    }
    if (changes.optionToString) {
      this._options.forEach(
        (opt) => (opt.asString = this.optionToString(opt.initial)),
      );
    }
    if (changes.value || changes.options) {
      this.setInitialInputValue();

      if (this.autocomplete?.panelOpen) {
        // if new options have been added, make sure to update the visible autocomplete options
        this.showAutocomplete(this.autocompleteForm.value);
      }
    }
  }

  ngAfterViewInit() {
    merge(
      fromEvent(window, "focus"),
      fromEvent(window, "resize"),
      this.viewportRuler.change(),
      this.getVisualViewportChangeEvents(),
    )
      .pipe(auditTime(16), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateOpenPanelPosition());
  }

  /**
   * Set the width of the dropdown panel programmatically to match the parent form field.
   * (this is not possible with pure CSS)
   *
   * Note: If the field is close to the viewport edge, Angular Material's overlay system may shift the dropdown horizontally
   * to keep it visible, causing minor misalignment. This is expected and ensures accessibility.
   */
  public updatePanelWidth() {
    // Use closest .mat-mdc-form-field or .mat-form-field from input element
    const fieldEl = this.inputElement?._elementRef?.nativeElement.closest(
      ".mat-mdc-form-field, .mat-form-field",
    ) as HTMLElement;
    const fieldWidth = fieldEl ? fieldEl.getBoundingClientRect().width : 200;
    this.panelWidth.set(`${fieldWidth}px`);
  }

  /**
   * Returns viewport-change events that are not always covered by window resize
   * (e.g. DevTools docking/undocking and some browser UI changes).
   */
  private getVisualViewportChangeEvents() {
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      return EMPTY;
    }

    return merge(
      fromEvent(visualViewport, "resize"),
      fromEvent(visualViewport, "scroll"),
    );
  }

  /**
   * Recomputes width and position of an open autocomplete panel.
   * Runs twice (immediately and on next animation frame) to handle late layout updates.
   */
  private updateOpenPanelPosition(): void {
    if (!this.autocomplete?.panelOpen) {
      return;
    }

    this.updatePanelWidth();
    this.autocomplete.updatePosition();

    requestAnimationFrame(() => {
      if (!this.autocomplete?.panelOpen) {
        return;
      }

      this.updatePanelWidth();
      this.autocomplete.updatePosition();
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      const reordered = [...this.autocompleteOptions()];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      this.autocompleteOptions.set(reordered);
    }
    this._selectedOptions.set(
      this.autocompleteOptions().filter((o) => o.selected),
    );
    if (this.multi) {
      this.value = this._selectedOptions().map((o) => o.asValue);
    } else {
      this.value = undefined;
    }
    this.setInitialInputValue();
    this.onChange(this.value);
    this.showAutocomplete(this.autocompleteForm.value);
  }

  showAutocomplete(valueToRevertTo?: string) {
    if (this.multi && this.retainSearchValue) {
      // reset the search value to previously entered text to help user selecting multiple similar options without retyping filter text
      this.autocompleteForm.setValue(this.retainSearchValue);
    } else if (this.multi && this.display === "text" && this.displayText) {
      // keep selected items visible when the multi-select input is focused/opened
      this.autocompleteForm.setValue(this.displayText);
    } else {
      // reset the search value to show all available options again
      this.autocompleteForm.setValue("");
    }
    if (!this.multi) {
      // cannot setValue to "" here because the current selection would be lost
      this.autocompleteForm.setValue(this.displayText, { emitEvent: false });
    }

    // Update panel width when autocomplete is actually shown (when form field is rendered)
    this.updatePanelWidth();

    setTimeout(() => {
      this.inputElement.focus();

      // select all text for easy overwriting when typing to search for options
      (
        this.inputElement._elementRef.nativeElement as HTMLInputElement
      ).select();
      if (valueToRevertTo) {
        this.autocompleteForm.setValue(valueToRevertTo);
      }
    });

    this.isInSearchMode.set(true);

    // update virtual scroll as the container remains empty until the user scrolls initially
    setTimeout(() => this.virtualScrollViewport?.checkViewportSize());
  }

  private updateAutocomplete(inputText: string): SelectableOption<O, V>[] {
    const filterText =
      this.multi && this.display === "text" && inputText === this.displayText
        ? ""
        : inputText;

    let filteredOptions = this._options.filter(
      (o) => !this.hideOption(o.initial) && !o.isHidden,
    );
    if (filterText) {
      this.autocompleteFilterFunction = (option) =>
        this.optionToString(option)
          ?.toLowerCase()
          ?.includes(filterText.toLowerCase());
      this.autocompleteFilterChange.emit(this.autocompleteFilterFunction);

      filteredOptions = filteredOptions.filter((o) =>
        this.autocompleteFilterFunction(o.initial),
      );

      // do not allow users to create a new entry "identical" to an existing one:
      this.showAddOption.set(
        !this._options.some(
          (o) => o?.asString?.toLowerCase() === filterText?.toLowerCase(),
        ),
      );
    }

    if (
      this.maxOptionsToDisplay > 0 &&
      filteredOptions.length > this.maxOptionsToDisplay
    ) {
      this.hasMoreOptions.set(true);
      filteredOptions = filteredOptions.slice(0, this.maxOptionsToDisplay);
    } else {
      this.hasMoreOptions.set(false);
    }

    return filteredOptions;
  }

  /**
   * Compare two enum values by id if present, otherwise by reference.
   */
  compareEnumValues(a: any, b: any): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.id !== undefined && b.id !== undefined) {
      return a.id === b.id;
    }
    if (a.value !== undefined && b.value !== undefined) {
      return a.value === b.value;
    }
    return false;
  }

  private setInitialInputValue() {
    this._options.forEach(
      (o) =>
        (o.selected = Array.isArray(this.value)
          ? this.value?.some((v) => this.compareEnumValues(v, o.asValue))
          : this.compareEnumValues(this.value, o.asValue)),
    );
    this._selectedOptions.set(
      this._options.filter((o) => o.selected && !o.isHidden),
    );
  }

  select(selected: string | SelectableOption<O, V> | CreateOptionMarker<O>) {
    if (
      selected != null &&
      typeof selected === "object" &&
      "__createOptionConfig" in selected
    ) {
      this.createFromConfig(selected as CreateOptionMarker<O>);
      return;
    }

    if (typeof selected === "string") {
      const defaultCreateOption = this.availableCreateOptions[0];
      if (defaultCreateOption) {
        this.createFromConfig(
          this.toCreateOptionValue(defaultCreateOption, selected),
        );
      }
      return;
    }

    if (selected) {
      this.selectOption(selected as SelectableOption<O, V>);
    } else {
      this.autocompleteForm.setValue("");
      this._selectedOptions.set([]);
      this.value = undefined;
    }
    this.onChange(this.value);
  }

  unselect(option: SelectableOption<O, V>) {
    option.selected = false;
    this._selectedOptions.set(this._options.filter((o) => o.selected));

    if (this.multi) {
      this.value = this._selectedOptions().map((o) => o.asValue);
    } else {
      this.value = undefined;
    }
    this.onChange(this.value);
  }

  /** @internal used in template to build a marker value for typed create options */
  protected toCreateOptionValue(
    option: CreateOptionConfig<O>,
    input: string,
  ): CreateOptionMarker<O> {
    return { __createOptionConfig: option, __input: input };
  }

  async createFromConfig(marker: CreateOptionMarker<O>) {
    const createdOption = await marker.__createOptionConfig.create(
      marker.__input,
    );
    if (createdOption) {
      const newOption = this.toSelectableOption(createdOption);
      this._options.push(newOption);
      this.select(newOption);
    } else {
      this.showAutocomplete();
      this.autocompleteForm.setValue(marker.__input);
    }
  }

  private selectOption(option: SelectableOption<O, V>) {
    if (this.multi) {
      option.selected = !option.selected;
      this._selectedOptions.set(this._options.filter((o) => o.selected));
      this.value = this._selectedOptions().map((o) => o.asValue);
      // re-open autocomplete to select next option
      setTimeout(() => this.showAutocomplete());
    } else {
      this._selectedOptions.set([option]);
      this.value = option.asValue;
      this.isInSearchMode.set(false);
    }
  }

  private toSelectableOption(opt: O): SelectableOption<O, V> {
    return {
      initial: opt,
      asValue: this.valueMapper(opt),
      asString: this.optionToString(opt),
      selected: false,
      isHidden: (opt as SelectableOption<O, V>)?.isHidden ?? false,
      isInvalid: (opt as SelectableOption<O, V>)?.isInvalid ?? false,
      isEmpty: (opt as SelectableOption<O, V>)?.isEmpty ?? false,
    };
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this.elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      if (!this.multi && this.autocompleteForm.value === "") {
        this.select(undefined);
      }
      this.isInSearchMode.set(false);
      this.retainSearchValue = "";
    }
  }
  override onContainerClick(event: MouseEvent) {
    const target = event.target;
    const clickedOption =
      target instanceof Element
        ? target.closest(".mat-mdc-option, .mat-option")
        : null;
    if (!this._disabled && !clickedOption) {
      this.showAutocomplete();
    }
  }

  override writeValue(val: V[] | V, notifyFormControl = false): void {
    super.writeValue(val, notifyFormControl);
    this.setInitialInputValue();
    this.cdr.markForCheck();
  }
}
