import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { RelatedEntitiesWithSummaryComponent } from "./related-entities-with-summary.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { DatabaseField } from "../../entity/database-field.decorator";
import { Entity } from "../../entity/model/entity";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";

describe("RelatedEntitiesWithSummaryComponent", () => {
  let component: RelatedEntitiesWithSummaryComponent;
  let fixture: ComponentFixture<RelatedEntitiesWithSummaryComponent>;

  @DatabaseEntity("TestEntityWithAmount")
  class TestEntityWithAmount extends Entity {
    @DatabaseField() amount: number;
    @DatabaseField() category: string;

    @DatabaseField({
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    })
    reference: string;

    @DatabaseField() other: string;

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
    spyOn(entityMapper, "receiveUpdates").and.returnValue(updates);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedEntitiesWithSummaryComponent);
    component = fixture.componentInstance;
    component.entity = primaryEntity;
    component.entityType = TestEntityWithAmount.ENTITY_TYPE;

    component.summaries = {
      countProperty: "amount",
      groupBy: "category",
      total: true,
      average: true,
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("produces an empty summary when there are no records", () => {
    component.data = [];
    component.updateSummary(component.data);
    expect(component.summarySum).toHaveSize(0);
    expect(component.summaryAvg).toHaveSize(0);
  });

  function setRecordsAndGenerateSummary(
    ...records: Partial<TestEntityWithAmount>[]
  ) {
    component.data = records.map(TestEntityWithAmount.create);
    component.updateSummary(component.data);
  }

  it("produces a singleton summary when there is a single record", () => {
    setRecordsAndGenerateSummary({ category: "PENCIL", amount: 1 });
    expect(component.summarySum).toEqual(`PENCIL: 1`);
    expect(component.summaryAvg).toEqual(`PENCIL: 1`);
  });

  it("produces a summary of all records when they are all different", () => {
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 2 },
      { category: "PAPER", amount: 1 },
      { amount: 1 },
    );
    expect(component.summarySum).toEqual(`PENCIL: 2, PAPER: 1, undefined: 1`);
    expect(component.summaryAvg).toEqual(`PENCIL: 2, PAPER: 1, undefined: 1`);
  });

  it("produces a singly summary without grouping, if `groupBy` is not given (or the group value undefined)", () => {
    component.data = [{ amount: 1 }, { amount: 5 }] as any[];
    delete component.summaries.groupBy;
    component.summaries.countProperty = "amount";
    component.updateSummary(component.data);

    expect(component.summarySum).toEqual(`6`);
    expect(component.summaryAvg).toEqual(`3`);
  });

  it("produces a summary of all records when there are duplicates", () => {
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(component.summarySum).toEqual(`PENCIL: 4, PAPER: 1`);
    expect(component.summaryAvg).toEqual(`PENCIL: 2, PAPER: 1`);
  });

  it("produces summary of all records when average is false and total is true", () => {
    component.summaries.total = true;
    component.summaries.average = false;
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(component.summarySum).toEqual(`PENCIL: 4, PAPER: 1`);
    expect(component.summaryAvg).toEqual(``);
  });

  it("produces summary of all records when average is true and total is false", () => {
    component.summaries.total = false;
    component.summaries.average = true;
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(component.summarySum).toEqual(``);
    expect(component.summaryAvg).toEqual(`PENCIL: 2, PAPER: 1`);
  });

  it("does not produces summary of all records when both average and total are false", () => {
    component.summaries.total = false;
    component.summaries.average = false;
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(component.summarySum).toEqual(``);
    expect(component.summaryAvg).toEqual(``);
  });

  it("produces summary of all records when both average and total are true", () => {
    setRecordsAndGenerateSummary(
      { category: "PENCIL", amount: 1 },
      { category: "PAPER", amount: 1 },
      { category: "PENCIL", amount: 3 },
    );

    expect(component.summarySum).toEqual(`PENCIL: 4, PAPER: 1`);
    expect(component.summaryAvg).toEqual(`PENCIL: 2, PAPER: 1`);
  });

  it("loads all data associated with the given ref and updates the summary", fakeAsync(() => {
    const data = [
      { category: "PENCIL", amount: 1, reference: primaryEntity.getId() },
      { category: "PAPER", amount: 2, reference: primaryEntity.getId() },
    ].map(TestEntityWithAmount.create);
    spyOn(TestBed.inject(EntityMapperService), "loadType").and.resolveTo(data);

    component.entity = new TestEntity("22");
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    tick();

    expect(component.summarySum).toEqual(`PENCIL: 1, PAPER: 2`);
    expect(component.data).toEqual(data);
  }));

  it("should update the summary when entity updates are received", fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();
    tick();

    const update1 = TestEntityWithAmount.create({
      reference: primaryEntity.getId(),
      category: "PENCIL",
      amount: 1,
    });
    updates.next({ entity: update1, type: "new" });
    fixture.detectChanges();
    tick();

    expect(component.data).toEqual([update1]);
    expect(component.summarySum).toBe(`PENCIL: 1`);

    const update2 = update1.copy() as TestEntityWithAmount;
    update2.amount = 2;
    updates.next({ entity: update2, type: "update" });
    fixture.detectChanges();
    tick();

    expect(component.data).toEqual([update2]);
    expect(component.summarySum).toBe(`PENCIL: 2`);

    const unrelatedUpdate = update1.copy() as TestEntityWithAmount;
    unrelatedUpdate.reference = "different-ref";
    updates.next({ entity: unrelatedUpdate, type: "new" });
    fixture.detectChanges();
    tick();
    // No change
    expect(component.data).toEqual([update2]);
    expect(component.summarySum).toBe(`PENCIL: 2`);
  }));
});
