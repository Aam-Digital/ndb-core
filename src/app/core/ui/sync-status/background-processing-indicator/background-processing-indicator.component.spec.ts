import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { BackgroundProcessingIndicatorComponent } from "./background-processing-indicator.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EMPTY, of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { expectObservable } from "../../../../utils/test-utils/observable-utils";

describe("BackgroundProcessingIndicatorComponent", () => {
  let component: BackgroundProcessingIndicatorComponent;
  let fixture: ComponentFixture<BackgroundProcessingIndicatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BackgroundProcessingIndicatorComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
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

  it("should aggregate process states by title if set to summarize", fakeAsync(() => {
    spyOn(component.taskListDropdownTrigger, "openMenu");
    const p1 = { title: "sync", pending: true };
    const p2a = { title: "indexing", details: "A", pending: false };
    const p2b = { title: "indexing", details: "B", pending: true };
    const p2c = { title: "indexing", details: "C", pending: false };
    const p3 = { title: "completed other stuff", pending: false };

    component.backgroundProcesses = of([p1, p2a, p2b, p2c, p3]);
    component.summarize = true;
    component.ngOnInit();

    expectObservable(component.taskCounterObservable).first.toBeResolvedTo(2);
    tick();
    expectObservable(component.filteredProcesses).first.toBeResolvedTo([
      p1,
      { title: p2a.title, pending: true },
      p3,
    ]);
    tick();
    expect(component.taskListDropdownTrigger.openMenu).toHaveBeenCalled();
  }));

  it("should automatically close details after all processes finished", fakeAsync(() => {
    component.backgroundProcesses = of([{ title: "sync", pending: false }]);
    spyOn(component.taskListDropdownTrigger, "closeMenu");
    component.ngOnInit();

    expectObservable(component.taskCounterObservable).first.toBeResolvedTo(0);
    tick();
    expect(component.taskListDropdownTrigger.closeMenu).toHaveBeenCalled();
  }));

  it("should not open details again if they the state before was already pending (and user may have manually closed)", fakeAsync(() => {
    component.backgroundProcesses = of([
      { title: "sync", pending: true },
      { title: "other", pending: true },
      { title: "yet another", pending: true },
    ]);
    spyOn(component.taskListDropdownTrigger, "openMenu");
    tick();
    expect(component.taskListDropdownTrigger.openMenu).not.toHaveBeenCalled();
  }));
});
