import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReadonlyFunctionComponent } from "./readonly-function.component";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("ReadonlyFunctionComponent", () => {
  let component: ReadonlyFunctionComponent;
  let fixture: ComponentFixture<ReadonlyFunctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadonlyFunctionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadonlyFunctionComponent);
    component = fixture.componentInstance;
    const formGroup = new UntypedFormGroup({});
    const formControl = new UntypedFormControl();
    formGroup.registerControl("name", formControl);
    component.entity = TestEntity.create("nameBefore");
    component.config = (entity) => entity.toString();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
