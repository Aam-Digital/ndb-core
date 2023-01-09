import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ShowFileComponent } from "./show-file.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatButtonHarness } from "@angular/material/button/testing";

describe("ShowFileComponent", () => {
  let component: ShowFileComponent;
  let fixture: ComponentFixture<ShowFileComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowFileComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: "test.link" }],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowFileComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open link in new tab when clicking the button", async () => {
    spyOn(window, "open");
    const button = await loader.getHarness(MatButtonHarness);

    await button.click();

    expect(window.open).toHaveBeenCalledWith("test.link", "_blank");
  });
});
