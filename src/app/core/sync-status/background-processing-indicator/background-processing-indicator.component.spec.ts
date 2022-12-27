import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { BackgroundProcessingIndicatorComponent } from "./background-processing-indicator.component";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatBadgeModule } from "@angular/material/badge";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EMPTY, of } from "rxjs";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { expectObservable } from "../../../utils/test-utils/observable-utils";

describe("BackgroundProcessingIndicatorComponent", () => {
  let component: BackgroundProcessingIndicatorComponent;
  let fixture: ComponentFixture<BackgroundProcessingIndicatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatMenuModule,
        MatTooltipModule,
        MatBadgeModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
        FontAwesomeModule,
        FontAwesomeTestingModule,
      ],
      declarations: [BackgroundProcessingIndicatorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundProcessingIndicatorComponent);
    component = fixture.componentInstance;
    component.backgroundProcesses = EMPTY;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should aggregate process states by title if set to summarize", async () => {
    spyOn(component.taskListDropdownTrigger, "openMenu");
    const p1 = { title: "sync", pending: true };
    const p2a = { title: "indexing", details: "A", pending: false };
    const p2b = { title: "indexing", details: "B", pending: true };
    const p2c = { title: "indexing", details: "C", pending: false };
    const p3 = { title: "completed other stuff", pending: false };

    component.backgroundProcesses = of([p1, p2a, p2b, p2c, p3]);
    component.summarize = true;
    component.ngOnInit();

    await expectObservable(
      component.taskCounterObservable
    ).first.toBeResolvedTo(2);
    await expectObservable(component.filteredProcesses).first.toBeResolvedTo([
      p1,
      { title: p2a.title, pending: true },
      p3,
    ]);
    expect(component.taskListDropdownTrigger.openMenu).toHaveBeenCalled();
  });

  it("should automatically close details after all processes finished", async () => {
    component.backgroundProcesses = of([{ title: "sync", pending: false }]);
    spyOn(component.taskListDropdownTrigger, "closeMenu");
    component.ngOnInit();

    await expectObservable(
      component.taskCounterObservable
    ).first.toBeResolvedTo(0);
    expect(component.taskListDropdownTrigger.closeMenu).toHaveBeenCalled();
  });

  it("should not open details again if they the state before was already pending (and user may have manually closed)", async () => {
    component.backgroundProcesses = of([
      { title: "sync", pending: true },
      { title: "other", pending: true },
      { title: "yet another", pending: true },
    ]);
    spyOn(component.taskListDropdownTrigger, "openMenu");

    expect(component.taskListDropdownTrigger.openMenu).not.toHaveBeenCalled();
  });
});
