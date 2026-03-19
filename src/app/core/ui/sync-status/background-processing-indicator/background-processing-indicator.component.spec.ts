import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { BackgroundProcessingIndicatorComponent } from "./background-processing-indicator.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EMPTY, firstValueFrom, of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { DatabaseResolverService } from "../../../database/database-resolver.service";

describe("BackgroundProcessingIndicatorComponent", () => {
  let component: BackgroundProcessingIndicatorComponent;
  let fixture: ComponentFixture<BackgroundProcessingIndicatorComponent>;
  let mockDbResolver: any;

  beforeEach(waitForAsync(() => {
    mockDbResolver = {
      resetSync: vi.fn().mockName("DatabaseResolverService.resetSync"),
    };
    mockDbResolver.resetSync.mockReturnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [
        BackgroundProcessingIndicatorComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: DatabaseResolverService, useValue: mockDbResolver },
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

  it("should aggregate process states by title if set to summarize", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(component.taskListDropdownTrigger, "openMenu");
      const p1 = { title: "sync", pending: true };
      const p2a = { title: "indexing", details: "A", pending: false };
      const p2b = { title: "indexing", details: "B", pending: true };
      const p2c = { title: "indexing", details: "C", pending: false };
      const p3 = { title: "completed other stuff", pending: false };

      component.backgroundProcesses = of([p1, p2a, p2b, p2c, p3]);
      component.summarize = true;
      component.ngOnInit();

      await expect(
        firstValueFrom(component.taskCounterObservable),
      ).resolves.toBe(2);
      await vi.advanceTimersByTimeAsync(0);
      await expect(
        firstValueFrom(component.filteredProcesses),
      ).resolves.toEqual([p1, { title: p2a.title, pending: true }, p3]);
      await vi.advanceTimersByTimeAsync(0);
      expect(component.taskListDropdownTrigger.openMenu).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should automatically close details after all processes finished", async () => {
    vi.useFakeTimers();
    try {
      component.backgroundProcesses = of([{ title: "sync", pending: false }]);
      vi.spyOn(component.taskListDropdownTrigger, "closeMenu");
      component.ngOnInit();

      await expect(
        firstValueFrom(component.taskCounterObservable),
      ).resolves.toBe(0);
      await vi.advanceTimersByTimeAsync(0);
      expect(component.taskListDropdownTrigger.closeMenu).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not open details again if they the state before was already pending (and user may have manually closed)", async () => {
    vi.useFakeTimers();
    try {
      component.backgroundProcesses = of([
        { title: "sync", pending: true },
        { title: "other", pending: true },
        { title: "yet another", pending: true },
      ]);
      vi.spyOn(component.taskListDropdownTrigger, "openMenu");
      await vi.advanceTimersByTimeAsync(0);
      expect(component.taskListDropdownTrigger.openMenu).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should call resetSync on DatabaseResolverService when resetSync is called", async () => {
    await component.resetSync();
    expect(mockDbResolver.resetSync).toHaveBeenCalled();
  });
});
