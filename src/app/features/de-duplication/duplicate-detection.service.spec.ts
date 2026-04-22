import { TestBed } from "@angular/core/testing";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { DuplicateDetectionService } from "./duplicate-detection.service";

describe("DuplicateDetectionService", () => {
  let service: DuplicateDetectionService;
  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [...mockEntityMapperProvider()],
    });
    service = TestBed.inject(DuplicateDetectionService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  afterEach(() => vi.restoreAllMocks());

  it("should return a pair for two entities matching on a single field (case-insensitive)", async () => {
    const a = TestEntity.create({ name: "Alice" });
    const b = TestEntity.create({ name: "alice" });
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, ["name"]);

    expect(result).toHaveLength(1);
    expect(result[0].record).toBe(a);
    expect(result[0].possibleDuplicate).toBe(b);
  });

  it("should return a pair when names differ only by Unicode whitespace (non-breaking space)", async () => {
    const a = TestEntity.create({ name: "Alice\u00A0Smith" });
    const b = TestEntity.create({ name: "Alice Smith" });
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, ["name"]);

    expect(result).toHaveLength(1);
  });

  it("should return a pair only when ALL selected fields match", async () => {
    const a = TestEntity.create({ name: "Alice", other: "X" });
    const b = TestEntity.create({ name: "alice", other: "X" });
    const c = TestEntity.create({ name: "alice", other: "Y" });
    entityMapper.addAll([a, b, c]);

    const result = await service.findDuplicates(TestEntity, ["name", "other"]);

    expect(result).toHaveLength(1);
    expect(result[0].record).toBe(a);
    expect(result[0].possibleDuplicate).toBe(b);
  });

  it("should not return a pair when field values differ", async () => {
    const a = TestEntity.create({ name: "Alice" });
    const b = TestEntity.create({ name: "Bob" });
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, ["name"]);

    expect(result).toHaveLength(0);
  });

  it("should not return a pair when a field value is empty on either entity", async () => {
    const a = TestEntity.create({ name: "" });
    const b = TestEntity.create({ name: "" });
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, ["name"]);

    expect(result).toHaveLength(0);
  });

  it("should not return a pair when a field value is null or undefined", async () => {
    const a = TestEntity.create({});
    const b = TestEntity.create({});
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, ["name"]);

    expect(result).toHaveLength(0);
  });

  it("should return only 1 pair for 3 mutually matching entities (no duplicate rows)", async () => {
    const a = TestEntity.create({ name: "Alice" });
    const b = TestEntity.create({ name: "alice" });
    const c = TestEntity.create({ name: "ALICE" });
    entityMapper.addAll([a, b, c]);

    const result = await service.findDuplicates(TestEntity, ["name"]);

    expect(result).toHaveLength(1);
  });

  it("should return empty array when there are no entities", async () => {
    const result = await service.findDuplicates(TestEntity, ["name"]);

    expect(result).toHaveLength(0);
  });

  it("should return empty array when no fields are selected", async () => {
    const a = TestEntity.create({ name: "Alice" });
    const b = TestEntity.create({ name: "Alice" });
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, []);

    expect(result).toHaveLength(0);
  });

  it("should not treat object-valued fields as duplicates", async () => {
    const a = TestEntity.create({ name: "Alice" });
    const b = TestEntity.create({ name: "Alice" });
    (a as unknown as Record<string, unknown>)["metadata"] = { key: "A" };
    (b as unknown as Record<string, unknown>)["metadata"] = { key: "B" };
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, ["metadata"]);

    expect(result).toHaveLength(0);
  });

  it("should match configurable-enum-like objects by id", async () => {
    const a = TestEntity.create({ name: "Alice" });
    const b = TestEntity.create({ name: "Bob" });
    (a as unknown as Record<string, unknown>)["center"] = {
      id: "barabazar",
      label: "Barabazar",
    };
    (b as unknown as Record<string, unknown>)["center"] = {
      id: "barabazar",
      label: "Bara Bazar",
    };
    entityMapper.addAll([a, b]);

    const result = await service.findDuplicates(TestEntity, ["center"]);

    expect(result).toHaveLength(1);
    expect(result[0].record).toBe(a);
    expect(result[0].possibleDuplicate).toBe(b);
  });
});
