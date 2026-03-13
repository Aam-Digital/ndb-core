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

  let mockChildrenService: any;
  let mockHistoricalDataService: any;

  beforeEach(() => {
    mockChildrenService = {
      getChildren: vi.fn(),
    } as unknown as any;
    mockHistoricalDataService = {
      getHistoricalDataFor: vi.fn(),
    } as unknown as any;

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
    mockChildrenService.getChildren.mockResolvedValue(testData);

    const actual = await service.loadData(LoaderMethod.ChildrenService);

    expect(actual).toEqual(testData);
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
  });
});
