import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ActivatedRoute } from "@angular/router";
import { MatTabsModule } from "@angular/material/tabs";
import { RouterTestingModule } from "@angular/router/testing";
import { CommonModule } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Component } from "@angular/core";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatTabGroupHarness } from "@angular/material/tabs/testing";
import { TabStateModule } from "./tab-state.module";

describe("TabStateService", () => {
  let fixture: ComponentFixture<TestAppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTabsModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule,
        TabStateModule,
      ],
      declarations: [TestAppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestAppComponent);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(fixture).toBeTruthy();
  });

  it("should change the URL when the tab index changes", fakeAsync(async () => {
    const tabGroupHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      MatTabGroupHarness,
    );
    const activatedRoute = TestBed.inject(ActivatedRoute);
    await tabGroupHarness.selectTab({ label: "D" });
    tick(); // the router `navigate` command is async
    expect(activatedRoute.snapshot.queryParamMap.get("tabIndex")).toBe("3");
  }));
});

@Component({
  template: `<mat-tab-group appTabStateMemo>
    <mat-tab label="A">A</mat-tab>
    <mat-tab label="B">B</mat-tab>
    <mat-tab label="C">C</mat-tab>
    <mat-tab label="D">D</mat-tab>
    <mat-tab label="E">E</mat-tab>
  </mat-tab-group>`,
})
class TestAppComponent {}
