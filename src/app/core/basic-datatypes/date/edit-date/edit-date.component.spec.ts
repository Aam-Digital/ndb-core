import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDateComponent } from "./edit-date.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/default-datatype/edit-component.spec";

describe("EditDateComponent", () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDateComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDateComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
