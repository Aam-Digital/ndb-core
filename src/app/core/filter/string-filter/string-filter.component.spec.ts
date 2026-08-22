import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  STRING_FILTER_DEBOUNCE_MS,
  StringFilterComponent,
} from "./string-filter.component";
import { StringFilter } from "../filters/stringFilter";
import { Entity } from "../../entity/model/entity";

describe("StringFilterComponent", () => {
  let component: StringFilterComponent<Entity>;
  let fixture: ComponentFixture<StringFilterComponent<Entity>>;
  let filter: StringFilter<Entity>;
  let emitted: string[][];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StringFilterComponent],
    }).compileComponents();

    filter = new StringFilter<Entity>("name", "Name");
    emitted = [];
    filter.selectedOptionChange.subscribe((v) => emitted.push(v));

    fixture = TestBed.createComponent(StringFilterComponent<Entity>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("filterConfig", filter);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not emit on every keystroke but coalesce into a single emit after the debounce", () => {
    vi.useFakeTimers();
    component.textControl.setValue("a");
    component.textControl.setValue("ab");
    component.textControl.setValue("abc");

    // still within the debounce window: nothing emitted yet
    vi.advanceTimersByTime(STRING_FILTER_DEBOUNCE_MS - 1);
    expect(emitted).toEqual([]);

    // once the user pauses, a single update with the final text is emitted
    vi.advanceTimersByTime(1);
    expect(emitted).toEqual([["abc"]]);
  });

  it("should emit an empty selection when the text is cleared", () => {
    vi.useFakeTimers();
    component.textControl.setValue("abc");
    vi.advanceTimersByTime(STRING_FILTER_DEBOUNCE_MS);
    expect(emitted).toEqual([["abc"]]);

    component.textControl.setValue("");
    vi.advanceTimersByTime(STRING_FILTER_DEBOUNCE_MS);
    expect(emitted).toEqual([["abc"], []]);
  });

  it("should reflect external changes without echoing them back through the debounce", () => {
    vi.useFakeTimers();
    // e.g. "clear all filters" emits an external change
    filter.selectedOptionChange.emit([]);
    vi.advanceTimersByTime(STRING_FILTER_DEBOUNCE_MS);

    expect(component.textControl.value).toBe("");
    // only the external emit is recorded, no echoed emit from the text input
    expect(emitted).toEqual([[]]);
  });
});
