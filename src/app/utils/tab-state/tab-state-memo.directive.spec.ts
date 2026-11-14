import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivatedRoute, Router } from "@angular/router";
import { MatTabsModule } from "@angular/material/tabs";
import {
  RouterTestingHarness,
  RouterTestingModule,
} from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Component, signal } from "@angular/core";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatTabGroupHarness } from "@angular/material/tabs/testing";
import { TabStateModule } from "./tab-state.module";

describe("TabStateService", () => {
  let fixture: ComponentFixture<TestAppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TestAppComponent,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: "**", component: EmptyRouteComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestAppComponent);

    fixture.detectChanges();
  });

  it("should change the URL when the tab index changes", async () => {
    const tabGroupHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      MatTabGroupHarness,
    );
    const activatedRoute = TestBed.inject(ActivatedRoute);
    await tabGroupHarness.selectTab({ label: "D" });
    await fixture.whenStable();
    expect(activatedRoute.snapshot.queryParamMap.get("_tabIndex")).toBe("3");
  });

  it("should switch the selected tab when the tabIndex query param changes while mounted", async () => {
    const tabGroupHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      MatTabGroupHarness,
    );
    const router = TestBed.inject(Router);

    // simulate an in-app navigation that only changes the tabIndex query param
    // (e.g. clicking the "Notification Settings" toolbar link while already here)
    await router.navigate([], { queryParams: { _tabIndex: 2 } });
    await fixture.whenStable();
    fixture.detectChanges();

    const selected = await tabGroupHarness.getSelectedTab();
    expect(await selected.getLabel()).toBe("C");
  });

  it("should switch to the first tab when navigating to another page reusing the component without a tabIndex", async () => {
    const tabGroupHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      MatTabGroupHarness,
    );
    const router = TestBed.inject(Router);
    await router.navigateByUrl("/child/1?_tabIndex=2");
    await fixture.whenStable();
    fixture.detectChanges();
    expect(await (await tabGroupHarness.getSelectedTab()).getLabel()).toBe("C");

    // e.g. "go to details" of a related record from a popup on the details page
    await router.navigateByUrl("/child/2");
    await fixture.whenStable();
    fixture.detectChanges();

    expect(await (await tabGroupHarness.getSelectedTab()).getLabel()).toBe("A");
  });

  it("should keep the selected tab when only other query params of the same page change", async () => {
    const tabGroupHarness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      MatTabGroupHarness,
    );
    const router = TestBed.inject(Router);
    await tabGroupHarness.selectTab({ label: "C" });
    await fixture.whenStable();

    await router.navigate([], { queryParams: { status: "active" } });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(await (await tabGroupHarness.getSelectedTab()).getLabel()).toBe("C");
  });

  it("updates a two-way bound selectedIndex to the tab restored from the URL", async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { _tabIndex: 2 } });

    // initial load of a page whose URL already holds a tabIndex (e.g. navigating back)
    const boundFixture = TestBed.createComponent(TwoWayBoundTestComponent);
    boundFixture.detectChanges();
    await boundFixture.whenStable();
    expect(boundFixture.componentInstance.selectedIndex()).toBe(2);
    boundFixture.detectChanges();

    // later in-app navigation that only changes the query param
    await router.navigate([], { queryParams: { _tabIndex: 1 } });
    boundFixture.detectChanges();
    await boundFixture.whenStable();
    expect(boundFixture.componentInstance.selectedIndex()).toBe(1);
  });

  it("clamps a restored tabIndex beyond the last tab before passing it to a two-way binding", async () => {
    await TestBed.inject(Router).navigate([], {
      queryParams: { _tabIndex: 9 },
    });

    const boundFixture = TestBed.createComponent(TwoWayBoundTestComponent);
    boundFixture.detectChanges();
    await boundFixture.whenStable();

    expect(boundFixture.componentInstance.selectedIndex()).toBe(2);
  });
});

describe("TabStateMemoDirective in a routed component", () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: "child/:id", component: TestAppComponent },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  async function navigateAndGetSelectedTab(url: string): Promise<string> {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const tabGroup = await TestbedHarnessEnvironment.harnessForFixture(
      harness.fixture,
      MatTabGroupHarness,
    );
    return (await tabGroup.getSelectedTab()).getLabel();
  }

  it.each([
    ["/child/1?_tabIndex=2", "C"],
    ["/child/1", "A"],
  ])(
    "selects the tab from the URL when the navigation to %s creates the component",
    async (url, expectedTab) => {
      expect(await navigateAndGetSelectedTab(url)).toBe(expectedTab);
    },
  );

  it.each([
    ["/child/2?_tabIndex=1", "B"],
    ["/child/2", "A"],
  ])(
    "selects the tab from the URL when navigating to %s reuses the component",
    async (url, expectedTab) => {
      await navigateAndGetSelectedTab("/child/1?_tabIndex=2");

      expect(await navigateAndGetSelectedTab(url)).toBe(expectedTab);
    },
  );
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

@Component({
  imports: [MatTabsModule, TabStateModule],
  template: `<mat-tab-group [(selectedIndex)]="selectedIndex" appTabStateMemo>
    <mat-tab label="A">A</mat-tab>
    <mat-tab label="B">B</mat-tab>
    <mat-tab label="C">C</mat-tab>
  </mat-tab-group>`,
})
class TwoWayBoundTestComponent {
  selectedIndex = signal(0);
}

@Component({ template: "" })
class EmptyRouteComponent {}
