import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { Subject } from "rxjs";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { DatabaseField } from "../../entity/database-field.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../entity/model/entity";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { RelatedEntitiesWithSummaryComponent } from "./related-entities-with-summary.component";

describe("RelatedEntitiesWithSummaryComponent", () => {
  let component: RelatedEntitiesWithSummaryComponent;
  let fixture: ComponentFixture<RelatedEntitiesWithSummaryComponent>;

  @DatabaseEntity("TestEntityWithAmount")
  class TestEntityWithAmount extends Entity {
    @DatabaseField()
    amount: number;
    @DatabaseField()
    category: string;

    @DatabaseField({
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    })
    reference: string;

    @DatabaseField()
    other: string;

    static create(data: Partial<TestEntityWithAmount>): TestEntityWithAmount {
      return Object.assign(new TestEntityWithAmount(), data);
    }
  }

  const updates = new Subject<UpdatedEntity<TestEntityWithAmount>>();
  const primaryEntity = new TestEntity("22");

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RelatedEntitiesWithSummaryComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();
    const entityMapper = TestBed.inject(EntityMapperService);
    vi.spyOn(entityMapper, "receiveUpdates").mockReturnValue(updates);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedEntitiesWithSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entity", primaryEntity);
    fixture.componentRef.setInput(
      "entityType",
      TestEntityWithAmount.ENTITY_TYPE,
    );

    fixture.componentRef.setInput("summaries", {
      countProperty: "amount",
      groupBy: "category",
      total: true,
      average: true,
    });

    fixture.detectChanges();
  });

  function getSummary() {
    return (component as any).summary() as { sum: string; avg: string };
  }

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  function setRecordsAndGenerateSummary(
    ...records: Partial<TestEntityWithAmount>[]
  ) {
    const data = records.map(TestEntityWithAmount.create);
    component.recordsDataSource().allRecords.set(data);
    component.recordsDataSource().filteredRecords.set(data);
  }

  it("produces an empty summary when there are no records", () => {
    setRecordsAndGenerateSummary();
    expect(getSummary().sum).toHaveLength(0);
    expect(getSummary().avg).toHaveLength(0);
  });

  it("produces a singleton summary when there is a single record", () => {
    setRecordsAndGenerateSummary({ category: "PENCIL", amount: 1 });
    expect(getSummary().sum).toEqual(`PENCIL: 1`);
    expect(getSummary().avg).toEqual(`PENCIL: 1`);
  });

  it("produces a summary of all records when they are all different", () => {
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 2 },
      { category: "PAPER", amount: 1 },
      { amount: 1 },
    );
    expect(getSummary().sum).toEqual(`PENCIL: 2, PAPER: 1, undefined: 1`);
    expect(getSummary().avg).toEqual(`PENCIL: 2, PAPER: 1, undefined: 1`);
  });

  it("produces a single summary without grouping, if `groupBy` is not given (or the group value undefined)", () => {
    const plainData = [{ amount: 1 }, { amount: 5 }] as any[];
    component.recordsDataSource().allRecords.set(plainData);
    const summaries = component.summaries();
    delete summaries.groupBy;
    summaries.countProperty = "amount";
    component.recordsDataSource().filteredRecords.set(plainData);

    expect(getSummary().sum).toEqual(`6`);
    expect(getSummary().avg).toEqual(`3`);
  });

  it("produces a summary of all records when there are duplicates", () => {
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(getSummary().sum).toEqual(`PENCIL: 4, PAPER: 1`);
    expect(getSummary().avg).toEqual(`PENCIL: 2, PAPER: 1`);
  });

  it("produces summary of all records when average is false and total is true", () => {
    const summaries = component.summaries();
    summaries.total = true;
    summaries.average = false;
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(getSummary().sum).toEqual(`PENCIL: 4, PAPER: 1`);
    expect(getSummary().avg).toEqual("");
  });

  it("produces summary of all records when average is true and total is false", () => {
    const summaries = component.summaries();
    summaries.total = false;
    summaries.average = true;
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(getSummary().sum).toEqual("");
    expect(getSummary().avg).toEqual(`PENCIL: 2, PAPER: 1`);
  });

  it("does not produces summary of all records when both average and total are false", () => {
    const summaries = component.summaries();
    summaries.total = false;
    summaries.average = false;
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(getSummary().sum).toEqual("");
    expect(getSummary().avg).toEqual("");
  });

  it("produces summary of all records when both average and total are true", () => {
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(getSummary().sum).toEqual(`PENCIL: 4, PAPER: 1`);
    expect(getSummary().avg).toEqual(`PENCIL: 2, PAPER: 1`);
  });

  it("loads all data associated with the given ref and updates the summary", async () => {
    vi.useFakeTimers();
    try {
      const data = [
        { category: "PENCIL", amount: 1, reference: primaryEntity.getId() },
        { category: "PAPER", amount: 2, reference: primaryEntity.getId() },
      ].map(TestEntityWithAmount.create);
      vi.spyOn(
        TestBed.inject(EntityMapperService),
        "loadType",
      ).mockResolvedValue(data);

      fixture.componentRef.setInput("entity", new TestEntity("22"));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      component
        .recordsDataSource()
        .filteredRecords.set(component.recordsDataSource().allRecords());

      expect(getSummary().sum).toEqual(`PENCIL: 1, PAPER: 2`);
      expect(component.recordsDataSource().allRecords()).toEqual(data);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update the summary when entity updates are received", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("entity", new TestEntity("22"));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const update1 = TestEntityWithAmount.create({
        reference: primaryEntity.getId(),
        category: "PENCIL",
        amount: 1,
      });
      updates.next({ entity: update1, type: "new" });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      component
        .recordsDataSource()
        .filteredRecords.set(component.recordsDataSource().allRecords());

      expect(component.recordsDataSource().allRecords()).toEqual([update1]);
      expect(getSummary().sum).toBe(`PENCIL: 1`);

      const update2 = update1.copy() as TestEntityWithAmount;
      update2.amount = 2;
      updates.next({ entity: update2, type: "update" });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      component
        .recordsDataSource()
        .filteredRecords.set(component.recordsDataSource().allRecords());

      expect(component.recordsDataSource().allRecords()).toEqual([update2]);
      expect(getSummary().sum).toBe(`PENCIL: 2`);

      const unrelatedUpdate = update1.copy() as TestEntityWithAmount;
      unrelatedUpdate.reference = "different-ref";
      updates.next({ entity: unrelatedUpdate, type: "new" });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      component
        .recordsDataSource()
        .filteredRecords.set(component.recordsDataSource().allRecords());
      // No change
      expect(component.recordsDataSource().allRecords()).toEqual([update2]);
      expect(getSummary().sum).toBe(`PENCIL: 2`);
    } finally {
      vi.useRealTimers();
    }
  });
});
