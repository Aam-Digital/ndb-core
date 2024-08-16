import { TestBed } from "@angular/core/testing";

import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "./entity-special-loader.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { HistoricalDataService } from "./historical-data/historical-data.service";

describe("EntitySpecialLoaderService", () => {
  let service: EntitySpecialLoaderService;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockHistoricalDataService: jasmine.SpyObj<HistoricalDataService>;

  beforeEach(() => {
    mockChildrenService = jasmine.createSpyObj(ChildrenService, [
      "getChildren",
    ]);
    mockHistoricalDataService = jasmine.createSpyObj(HistoricalDataService, [
      "getHistoricalDataFor",
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: HistoricalDataService, useValue: mockHistoricalDataService },
      ],
    });
    service = TestBed.inject(EntitySpecialLoaderService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load via ChildrenService", async () => {
    const testData = [new TestEntity()] as any[];
    mockChildrenService.getChildren.and.resolveTo(testData);

    const actual = await service.loadData(LoaderMethod.ChildrenService);

    expect(actual).toEqual(testData);
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
  });
});
