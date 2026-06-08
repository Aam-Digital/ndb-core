import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RecordDiffComponent } from "./record-diff.component";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { Entity } from "../../../core/entity/model/entity";
import { ChangeEvent } from "../change-history.types";

class TestEntity extends Entity {}

let loadSpy: ReturnType<typeof vi.fn>;

async function render(
  event: ChangeEvent,
): Promise<ComponentFixture<RecordDiffComponent>> {
  loadSpy = vi.fn((entity, data) => Object.assign(entity, data));
  await TestBed.configureTestingModule({
    imports: [RecordDiffComponent],
    providers: [
      {
        provide: EntitySchemaService,
        useValue: { loadDataIntoEntity: loadSpy },
      },
    ],
  })
    // strip the template so child datatype components aren't rendered — this
    // spec verifies the diff-row wiring, not the field-view rendering
    .overrideComponent(RecordDiffComponent, {
      set: { template: "", imports: [] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(RecordDiffComponent);
  fixture.componentRef.setInput("event", event);
  fixture.componentRef.setInput("entityType", TestEntity);
  fixture.detectChanges();
  return fixture;
}

function event(partial: Partial<ChangeEvent>): ChangeEvent {
  return {
    id: "AuditRecord:Test:1:t:1-a",
    at: new Date(),
    by: "User:1",
    action: "updated",
    changes: [],
    ...partial,
  };
}

it("builds one diff row per changed field, seeding old/new transient entities", async () => {
  const fixture = await render(
    event({ changes: [{ field: "name", from: "A", to: "B" }] }),
  );
  const rows = fixture.componentInstance.rows();
  expect(rows).toHaveLength(1);
  expect(rows[0].field).toBe("name");
  expect(rows[0].hasFrom).toBe(true);
  expect(rows[0].hasTo).toBe(true);
  // each side loaded through the schema with only its own value
  expect(loadSpy).toHaveBeenCalledWith(expect.any(TestEntity), { name: "A" });
  expect(loadSpy).toHaveBeenCalledWith(expect.any(TestEntity), { name: "B" });
});

it("treats an addition (empty from) as hasFrom=false and seeds the old side empty", async () => {
  const fixture = await render(
    event({
      action: "created",
      changes: [{ field: "name", from: undefined, to: "Asha" }],
    }),
  );
  const rows = fixture.componentInstance.rows();
  expect(rows[0].hasFrom).toBe(false);
  expect(rows[0].hasTo).toBe(true);
  expect(loadSpy).toHaveBeenCalledWith(expect.any(TestEntity), {});
  expect(loadSpy).toHaveBeenCalledWith(expect.any(TestEntity), {
    name: "Asha",
  });
});

it("treats an empty array as empty", async () => {
  const fixture = await render(
    event({ changes: [{ field: "center", from: [], to: ["alipore"] }] }),
  );
  const rows = fixture.componentInstance.rows();
  expect(rows[0].hasFrom).toBe(false);
  expect(rows[0].hasTo).toBe(true);
});

it("flags a deleted record as structural", async () => {
  const fixture = await render(event({ action: "deleted", changes: [] }));
  expect(fixture.componentInstance.isStructural()).toBe(true);
});

it("is not structural for an update", async () => {
  const fixture = await render(
    event({
      action: "updated",
      changes: [{ field: "name", from: "A", to: "B" }],
    }),
  );
  expect(fixture.componentInstance.isStructural()).toBe(false);
});
