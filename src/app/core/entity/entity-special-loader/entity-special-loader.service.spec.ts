import { TestBed } from "@angular/core/testing";

import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "./entity-special-loader.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { HistoricalDataService } from "./historical-data/historical-data.service";
import type { Mock } from "vitest";

type ChildrenServiceMock = {
  getChildren: Mock;
};

type HistoricalDataServiceMock = {
  getHistoricalDataFor: Mock;
};

describe("EntitySpecialLoaderService", () => {
  let service: EntitySpecialLoaderService;

  let mockChildrenService: ChildrenServiceMock;
  let mockHistoricalDataService: HistoricalDataServiceMock;

  beforeEach(() => {
    mockChildrenService = {
      getChildren: vi.fn(),
    };
    mockHistoricalDataService = {
      getHistoricalDataFor: vi.fn(),
    };

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
    const testData = [new TestEntity()];
    mockChildrenService.getChildren.mockResolvedValue(testData);

    const actual = await service.loadData(LoaderMethod.ChildrenService);

    expect(actual).toEqual(testData);
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
  });
});
