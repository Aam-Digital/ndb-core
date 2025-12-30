import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { DateImportConfigComponent } from "./date-import-config.component";
import { MappingDialogData } from "app/core/import/import-column-mapping/mapping-dialog-data";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import moment from "moment";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("DateImportConfigComponent", () => {
  let component: DateImportConfigComponent;
  let fixture: ComponentFixture<DateImportConfigComponent>;
  const values = ["01/02/2023", "14/04/2023", "5/4/2023"];
  let data: MappingDialogData;

  beforeEach(async () => {
    data = { values, col: { column: "" }, entityType: undefined };
    await TestBed.configureTestingModule({
      imports: [
        DateImportConfigComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateImportConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should parse dates with entered format", fakeAsync(() => {
    component.format.setValue("d/m/yyyy");
    tick();

    //Tests may fail with moment.js > 2.29v
    expect(component.values.map(({ parsed }) => parsed)).toEqual([
      moment("2023-02-01").toDate(),
      moment("2023-04-14").toDate(),
      moment("2023-04-05").toDate(),
    ]);
  }));

  it("should sort dates that could not be parsed to top", fakeAsync(() => {
    component.format.setValue("dd/mm/yyyy");
    tick();

    expect(component.values[0].value).toBe("5/4/2023");
    expect(component.values[0].parsed).toBeUndefined();
    expect(component.values[1].parsed).toBeDate("2023-02-01");
    expect(component.values[2].parsed).toBeDate("2023-04-14");
  }));

  it("should ask for confirmation on save if some dates could not be parsed", fakeAsync(() => {
    const confirmationSpy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation",
    );
    component.format.setValue("dd/mm/yyyy");
    tick();

    component.save();

    expect(confirmationSpy).toHaveBeenCalled();
  }));

  it("should set the format as additional on save", async () => {
    expect(data.col.additional).toBeUndefined();
    component.format.setValue("d/m/yyyy");
    const closeSpy = spyOn(TestBed.inject(MatDialogRef), "close");

    await component.save();

    //Tests may fail with moment.js > 2.29
    expect(closeSpy).toHaveBeenCalled();
    expect(data.col.additional).toBe("D/M/YYYY");
  });
});
