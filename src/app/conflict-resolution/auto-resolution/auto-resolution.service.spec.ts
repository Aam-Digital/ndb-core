import { TestBed } from "@angular/core/testing";

import { AutoResolutionService } from "./auto-resolution.service";
import {
  CONFLICT_RESOLUTION_STRATEGY,
  ConflictResolutionStrategy,
} from "./conflict-resolution-strategy";

describe("AutoResolutionService", () => {
  let service: AutoResolutionService;

  let mockResolutionStrategy: jasmine.SpyObj<ConflictResolutionStrategy>;

  beforeEach(() => {
    mockResolutionStrategy = jasmine.createSpyObj("mockResolutionStrategy", [
      "autoDeleteConflictingRevision",
    ]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CONFLICT_RESOLUTION_STRATEGY,
          useValue: mockResolutionStrategy,
          multi: true,
        },
      ],
    });
    service = TestBed.inject<AutoResolutionService>(AutoResolutionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should suggest auto delete conflict if a strategy applies", () => {
    const testDoc = { _id: "abc", _rev: "rev-1a", value: 1 };
    const testConflictDoc = { _id: "abc", _rev: "rev-1b", value: 2 };

    mockResolutionStrategy.autoDeleteConflictingRevision.and.returnValue(true);

    const result = service.shouldDeleteConflictingRevision(
      testDoc,
      testConflictDoc
    );

    expect(
      mockResolutionStrategy.autoDeleteConflictingRevision
    ).toHaveBeenCalled();
    expect(result).toBeTrue();
  });

  it("should not suggest auto delete conflicts if no strategy applies", () => {
    const testDoc = { _id: "abc", _rev: "rev-1a", value: 1 };
    const testConflictDoc = { _id: "abc", _rev: "rev-1b", value: 2 };

    mockResolutionStrategy.autoDeleteConflictingRevision.and.returnValue(false);

    const result = service.shouldDeleteConflictingRevision(
      testDoc,
      testConflictDoc
    );

    expect(
      mockResolutionStrategy.autoDeleteConflictingRevision
    ).toHaveBeenCalled();
    expect(result).toBeFalse();
  });
});
