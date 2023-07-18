import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateValueMappingComponent } from "./date-value-mapping.component";
import { MappingDialogData } from "../import-column-mapping.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import moment from "moment";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";

describe("DateValueMappingComponent", () => {
  let component: DateValueMappingComponent;
  let fixture: ComponentFixture<DateValueMappingComponent>;
  const values = ["01/02/2023", "14/04/2023", "5/4/2023"];
  let data: MappingDialogData;

  beforeEach(async () => {
    data = { values, col: { column: "" }, entityType: undefined };
    await TestBed.configureTestingModule({
      imports: [DateValueMappingComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateValueMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should parse dates with entered format", () => {
    component.format.setValue("d/m/yyyy");

    expect(component.values.map(({ parsed }) => parsed)).toEqual([
      moment("2023-02-01").toDate(),
      moment("2023-04-14").toDate(),
      moment("2023-04-05").toDate(),
    ]);
  });

  it("should sort dates that could not be parsed to top", () => {
    component.format.setValue("dd/mm/yyyy");

    expect(component.values[0].value).toBe("5/4/2023");
    expect(component.values[0].parsed).toBeUndefined();
    expect(component.values[1].parsed).toBeDate("2023-02-01");
    expect(component.values[2].parsed).toBeDate("2023-04-14");
  });

  it("should ask for confirmation on save if some dates could not be parsed", () => {
    const confirmationSpy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation"
    );
    component.format.setValue("dd/mm/yyyy");

    component.save();

    expect(confirmationSpy).toHaveBeenCalled();
  });

  it("should set the format as additional on save", () => {
    expect(data.col.additional).toBeUndefined();
    component.format.setValue("d/m/yyyy");
    const closeSpy = spyOn(TestBed.inject(MatDialogRef), "close");

    component.save();

    expect(closeSpy).toHaveBeenCalled();
    expect(data.col.additional).toBe("D/M/YYYY");
  });
});
