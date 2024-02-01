import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HistoricalDataComponent } from "./historical-data.component";
import { Entity } from "../../../core/entity/model/entity";
import { HistoricalEntityData } from "../model/historical-entity-data";
import moment from "moment";
import { HistoricalDataService } from "../historical-data.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

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

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalDataComponent);
    component = fixture.componentInstance;

    component.entity = new Entity();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the historical data", async () => {
    component.entity = new Entity();
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
    component.entity = new Entity();

    const newEntry = component.getNewEntryFunction()();

    expect(newEntry.relatedEntity).toBe(component.entity.getId());
    expect(moment(newEntry.date).isSame(new Date(), "day")).toBeTrue();
  });
});
