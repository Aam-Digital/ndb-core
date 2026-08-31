import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivatedRoute, Router } from "@angular/router";
import { MatTabsModule } from "@angular/material/tabs";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Component } from "@angular/core";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatTabGroupHarness } from "@angular/material/tabs/testing";
import { TabStateModule } from "./tab-state.module";

describe("TabStateService", () => {
  let fixture: ComponentFixture<TestAppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestAppComponent, NoopAnimationsModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestAppComponent);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(fixture).toBeTruthy();
  });

  it("should change the URL when the tab index changes", async () => {
    const tabGroupHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      MatTabGroupHarness,
    );
    const activatedRoute = TestBed.inject(ActivatedRoute);
    await tabGroupHarness.selectTab({ label: "D" });
    await fixture.whenStable();
    expect(activatedRoute.snapshot.queryParamMap.get("tabIndex")).toBe("3");
  });

  it("should switch the selected tab when the tabIndex query param changes while mounted", async () => {
    const tabGroupHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      MatTabGroupHarness,
    );
    const router = TestBed.inject(Router);

    // simulate an in-app navigation that only changes the tabIndex query param
    // (e.g. clicking the "Notification Settings" toolbar link while already here)
    await router.navigate([], { queryParams: { tabIndex: 2 } });
    await fixture.whenStable();
    fixture.detectChanges();

    const selected = await tabGroupHarness.getSelectedTab();
    expect(await selected.getLabel()).toBe("C");
  });
});

@Component({
  imports: [MatTabsModule, TabStateModule],
  template: `<mat-tab-group appTabStateMemo>
    <mat-tab label="A">A</mat-tab>
    <mat-tab label="B">B</mat-tab>
    <mat-tab label="C">C</mat-tab>
    <mat-tab label="D">D</mat-tab>
    <mat-tab label="E">E</mat-tab>
  </mat-tab-group>`,
  standalone: true,
})
class TestAppComponent {}
