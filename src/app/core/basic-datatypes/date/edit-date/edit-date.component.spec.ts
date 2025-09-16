import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateAdapter, MAT_DATE_FORMATS } from "@angular/material/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/default-datatype/edit-component.spec";
import { DATE_FORMATS, DateAdapterWithFormatting } from "../../../language/date-adapter-with-formatting";
import { EditDateComponent } from "./edit-date.component";

describe("EditDateComponent", () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDateComponent, NoopAnimationsModule],
      providers: [
        { provide: DateAdapter, useClass: DateAdapterWithFormatting },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
      ],
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
