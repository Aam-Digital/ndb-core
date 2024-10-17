import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { setupEditComponent } from "../../../entity/default-datatype/edit-component.spec";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditConfigurableEnumComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditConfigurableEnumComponent);
    component = fixture.componentInstance;
    setupEditComponent(component, "test", { additional: "some-id" });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should extract the enum ID", () => {
    setupEditComponent(component, "test", { additional: "some-id" });
    component.ngOnInit();
    expect(component.enumId).toBe("some-id");
  });

  it("should detect multi selection mode", () => {
    setupEditComponent(component, "test", { additional: "some-id" });
    component.ngOnInit();
    expect(component.multi).toBeFalsy();

    setupEditComponent(component, "test", {
      isArray: true,
      additional: "some-id",
    });
    component.ngOnInit();
    expect(component.multi).toBeTrue();
  });
});
