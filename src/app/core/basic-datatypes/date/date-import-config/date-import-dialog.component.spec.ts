import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateImportDialogComponent } from "./date-import-dialog.component";
import { MappingDialogData } from "app/core/import/import-column-mapping/mapping-dialog-data";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import moment from "moment";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("DateImportDialogComponent", () => {
  let component: DateImportDialogComponent;
  let fixture: ComponentFixture<DateImportDialogComponent>;
  const values = ["01/02/2023", "14/04/2023", "5/4/2023"];
  let data: MappingDialogData;

  beforeEach(async () => {
    data = {
      values,
      totalRowCount: values.length,
      col: { column: "" },
      entityType: undefined,
    };
    await TestBed.configureTestingModule({
      imports: [
        DateImportDialogComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        {
          provide: ConfirmationDialogService,
          useValue: { getConfirmation: vi.fn().mockResolvedValue(true) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should parse dates with entered format", async () => {
    vi.useFakeTimers();
    try {
      component.format.setValue("D/M/YYYY");
      await vi.advanceTimersByTimeAsync(0);

      //Tests may fail with moment.js > 2.29v
      expect(component.values.map(({ parsed }) => parsed)).toEqual([
        moment("2023-02-01").toDate(),
        moment("2023-04-14").toDate(),
        moment("2023-04-05").toDate(),
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should sort dates that could not be parsed to top", async () => {
    vi.useFakeTimers();
    try {
      component.format.setValue("DD/MM/YYYY");
      await vi.advanceTimersByTimeAsync(0);

      expect(component.values[0].value).toBe("5/4/2023");
      expect(component.values[0].parsed).toBeUndefined();
      expect(component.values[1].parsed?.getTime()).toBe(
        new Date(2023, 1, 1).getTime(),
      );
      expect(component.values[2].parsed?.getTime()).toBe(
        new Date(2023, 3, 14).getTime(),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should ask for confirmation on save if some dates could not be parsed", async () => {
    vi.useFakeTimers();
    try {
      const confirmationSpy = vi.spyOn(
        TestBed.inject(ConfirmationDialogService),
        "getConfirmation",
      );
      component.format.setValue("DD/MM/YYYY");
      await vi.advanceTimersByTimeAsync(0);

      component.save();

      expect(confirmationSpy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set the format as additional on save", async () => {
    expect(data.col.additional).toBeUndefined();
    component.format.setValue("D/M/YYYY");
    const closeSpy = vi.spyOn(TestBed.inject(MatDialogRef), "close");

    await component.save();

    //Tests may fail with moment.js > 2.29
    expect(closeSpy).toHaveBeenCalled();
    expect(data.col.additional).toBe("D/M/YYYY");
  });
});
