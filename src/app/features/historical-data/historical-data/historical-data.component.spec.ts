import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HistoricalDataComponent } from "./historical-data.component";
import { HistoricalEntityData } from "../model/historical-entity-data";
import moment from "moment";
import { HistoricalDataService } from "../historical-data.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";

describe("HistoricalDataComponent", () => {
  let component: HistoricalDataComponent;
  let fixture: ComponentFixture<HistoricalDataComponent>;
  let mockHistoricalDataService: jasmine.SpyObj<HistoricalDataService>;

  beforeEach(waitForAsync(() => {
    mockHistoricalDataService = jasmine.createSpyObj(["getHistoricalDataFor"]);
    mockHistoricalDataService.getHistoricalDataFor.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [HistoricalDataComponent, MockedTestingModule.withState()],
      providers: [
        { provide: HistoricalDataService, useValue: mockHistoricalDataService },
        { provide: FormDialogService, useValue: null },
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(HistoricalDataComponent);
    component = fixture.componentInstance;

    component.entity = createEntityOfType("Child");
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the historical data", async () => {
    const relatedData = new HistoricalEntityData();
    relatedData.relatedEntity = component.entity.getId();
    mockHistoricalDataService.getHistoricalDataFor.and.resolveTo([relatedData]);

    await component.ngOnInit();

    expect(component.data).toEqual([relatedData]);
    expect(mockHistoricalDataService.getHistoricalDataFor).toHaveBeenCalledWith(
      component.entity.getId(),
    );
  });

  it("should generate new records with a link to the passed entity", () => {
    const newEntry = component.createNewRecordFactory()();

    expect(newEntry.relatedEntity).toBe(component.entity.getId());
    expect(moment(newEntry.date).isSame(new Date(), "day")).toBeTrue();
  });
});
