import { TestBed } from "@angular/core/testing";
import { DemoValueService } from "./demo-value.service";
import { DEMO_VALUE_GENERATOR, DemoValueContext, DemoValueGenerator } from "./demo-value-generator";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { faker } from "../faker";

const mockCtx: DemoValueContext = {
  faker,
  entityStore: new Map(),
  generateValue: () => undefined,
};

describe("DemoValueService", () => {
  it("returns undefined for a dataType with no registered generator", () => {
    TestBed.configureTestingModule({ providers: [DemoValueService] });
    const svc = TestBed.inject(DemoValueService);

    const result = svc.generate({ dataType: "unknown-type" }, mockCtx);

    expect(result).toBeUndefined();
  });

  it("dispatches to the matching registered generator", () => {
    const mockGen: DemoValueGenerator = {
      dataType: "my-type",
      generate: () => "generated-value",
    };

    TestBed.configureTestingModule({
      providers: [
        DemoValueService,
        { provide: DEMO_VALUE_GENERATOR, useValue: mockGen, multi: true },
      ],
    });
    const svc = TestBed.inject(DemoValueService);

    const result = svc.generate({ dataType: "my-type" } as EntitySchemaField, mockCtx);

    expect(result).toBe("generated-value");
  });

  it("uses the last registered generator when the same dataType is contributed twice", () => {
    const first: DemoValueGenerator = { dataType: "dup", generate: () => "first" };
    const second: DemoValueGenerator = { dataType: "dup", generate: () => "second" };

    TestBed.configureTestingModule({
      providers: [
        DemoValueService,
        { provide: DEMO_VALUE_GENERATOR, useValue: first, multi: true },
        { provide: DEMO_VALUE_GENERATOR, useValue: second, multi: true },
      ],
    });
    const svc = TestBed.inject(DemoValueService);

    // last registration wins (Map.set overwrites)
    const result = svc.generate({ dataType: "dup" } as EntitySchemaField, mockCtx);

    expect(result).toBe("second");
  });
});
