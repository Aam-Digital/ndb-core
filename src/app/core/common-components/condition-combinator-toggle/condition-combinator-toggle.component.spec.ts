import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatButtonToggleGroupHarness } from "@angular/material/button-toggle/testing";

import { ConditionCombinatorToggleComponent } from "./condition-combinator-toggle.component";

describe("ConditionCombinatorToggleComponent", () => {
  let fixture: ComponentFixture<ConditionCombinatorToggleComponent>;
  let component: ConditionCombinatorToggleComponent;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConditionCombinatorToggleComponent],
    });
    fixture = TestBed.createComponent(ConditionCombinatorToggleComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.componentRef.setInput("value", "any");
    fixture.detectChanges();
  });

  it("reflects the given value as the selected toggle", async () => {
    const group = await loader.getHarness(MatButtonToggleGroupHarness);
    const toggles = await group.getToggles({ checked: true });
    const values = await Promise.all(toggles.map((t) => t.getText()));

    expect(values).toEqual(["Any"]);
  });

  it("emits valueChange when the user picks a different option", async () => {
    const changes: string[] = [];
    component.valueChange.subscribe((v) => changes.push(v));

    const group = await loader.getHarness(MatButtonToggleGroupHarness);
    const [allToggle] = await group.getToggles({ text: "All" });
    await allToggle.check();

    expect(changes).toEqual(["all"]);
  });
});
