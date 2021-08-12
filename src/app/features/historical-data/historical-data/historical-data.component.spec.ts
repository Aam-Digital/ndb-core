import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { HistoricalDataComponent } from "./historical-data.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HistoricalDataModule } from "../historical-data.module";
import { Entity } from "../../../core/entity/model/entity";
import { HistoricalEntityData } from "../historical-entity-data";
import moment from "moment";
import { DatePipe } from "@angular/common";
import { HistoricalDataService } from "../historical-data.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";

describe("HistoricalDataComponent", () => {
  let component: HistoricalDataComponent;
  let fixture: ComponentFixture<HistoricalDataComponent>;
  let mockHistoricalDataService: jasmine.SpyObj<HistoricalDataService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(async () => {
    mockHistoricalDataService = jasmine.createSpyObj(["getHistoricalDataFor"]);
    mockHistoricalDataService.getHistoricalDataFor.and.resolveTo([]);
    mockSessionService = jasmine.createSpyObj(["getCurrentDBUser"]);
    mockSessionService.getCurrentDBUser.and.returnValue({
      name: "TestUser",
      roles: [],
    });

    await TestBed.configureTestingModule({
      declarations: [HistoricalDataComponent],
      imports: [HistoricalDataModule, NoopAnimationsModule],
      providers: [
        { provide: HistoricalDataService, useValue: mockHistoricalDataService },
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([new User("TestUser")]),
        },
        DatePipe,
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalDataComponent);
    component = fixture.componentInstance;

    component.onInitFromDynamicConfig({
      entity: new Entity(),
      config: [],
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the historical data", fakeAsync(() => {
    const entity = new Entity();
    const relatedData = new HistoricalEntityData();
    relatedData.relatedEntity = entity.getId();
    mockHistoricalDataService.getHistoricalDataFor.and.resolveTo([relatedData]);

    component.onInitFromDynamicConfig({ entity: entity });
    tick();

    expect(component.entries).toEqual([relatedData]);
    expect(mockHistoricalDataService.getHistoricalDataFor).toHaveBeenCalledWith(
      entity.getId()
    );
  }));

  it("should generate new records with a link to the passed entity", () => {
    const entity = new Entity();
    component.onInitFromDynamicConfig({ entity: entity });

    const newEntry = component.getNewEntryFunction()();

    expect(newEntry.relatedEntity).toBe(entity.getId());
    expect(moment(newEntry.date).isSame(new Date(), "day")).toBeTrue();
  });
});
