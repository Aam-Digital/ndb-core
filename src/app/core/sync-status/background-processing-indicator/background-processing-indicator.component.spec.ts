import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BackgroundProcessingIndicatorComponent } from "./background-processing-indicator.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconModule } from "@angular/material/icon";
import { MatBadgeModule } from "@angular/material/badge";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { SimpleChange } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("BackgroundProcessingIndicatorComponent", () => {
  let component: BackgroundProcessingIndicatorComponent;
  let fixture: ComponentFixture<BackgroundProcessingIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatMenuModule,
        MatTooltipModule,
        MatIconModule,
        MatBadgeModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
      ],
      declarations: [BackgroundProcessingIndicatorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundProcessingIndicatorComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should aggregate process states by title if set to summarize", async () => {
    const p1 = { title: "sync", pending: true };
    const p2a = { title: "indexing", details: "A", pending: false };
    const p2b = { title: "indexing", details: "B", pending: true };
    const p2c = { title: "indexing", details: "C", pending: false };
    const p3 = { title: "completed other stuff", pending: false };
    component.backgroundProcesses = [p1, p2a, p2b, p2c, p3];
    component.summarize = true;
    spyOn(component.taskListDropdownTrigger, "openMenu");

    component.ngOnChanges({
      backgroundProcesses: new SimpleChange(
        [],
        component.backgroundProcesses,
        false
      ),
    });
    fixture.detectChanges();

    expect(component.taskCounter).toBe(2); // not counting the pending === false
    expect(component.backgroundProcesses).toEqual([
      p1,
      { title: p2a.title, pending: true },
      p3,
    ]);
    expect(component.taskListDropdownTrigger.openMenu).toHaveBeenCalled();
  });

  it("should automatically close details after all processes finished", async () => {
    component.backgroundProcesses = [{ title: "sync", pending: false }];
    spyOn(component.taskListDropdownTrigger, "closeMenu");

    component.ngOnChanges({
      backgroundProcesses: new SimpleChange(
        [],
        component.backgroundProcesses,
        false
      ),
    });
    fixture.detectChanges();

    expect(component.taskCounter).toBe(0);
    expect(component.taskListDropdownTrigger.closeMenu).toHaveBeenCalled();
  });

  it("should not open details again if they the state before was already pending (and user may have manually closed)", async () => {
    component.backgroundProcesses = [
      { title: "sync", pending: true },
      { title: "other", pending: true },
      { title: "yet another", pending: true },
    ];
    spyOn(component.taskListDropdownTrigger, "openMenu");

    component.ngOnChanges({
      backgroundProcesses: new SimpleChange(
        [
          { title: "sync", pending: true },
          { title: "other", pending: true },
        ],
        component.backgroundProcesses,
        false
      ),
    });
    fixture.detectChanges();

    expect(component.taskListDropdownTrigger.openMenu).not.toHaveBeenCalled();
  });
});
