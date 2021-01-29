import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { HealthCheck } from "app/child-dev-project/health-checkup/model/health-check";
import { Database } from "app/core/database/database";
import { MockDatabase } from "app/core/database/mock-database";
import { DatabaseIndexingService } from "app/core/entity/database-indexing/database-indexing.service";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { of } from "rxjs";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";

import { BmiBlockComponent } from "./bmi-block.component";

describe("BmiBlockComponent", () => {
  let component: BmiBlockComponent;
  let fixture: ComponentFixture<BmiBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BmiBlockComponent],
      providers: [
        { provide: Database, useClass: MockDatabase },
        EntityMapperService,
        EntitySchemaService,
        DatabaseIndexingService,
        ChildrenService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BmiBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the BMI data for the child", (done) => {
    const testChild = new Child("testID");
    const HealthCheck1 = new HealthCheck("hc1");
    HealthCheck1.date = new Date("2020-10-30");
    HealthCheck1.height = 1.3;
    HealthCheck1.weight = 60;
    const HealthCheck2 = new HealthCheck("hc2");
    HealthCheck2.date = new Date("2020-11-30");
    HealthCheck2.height = 1.5;
    HealthCheck2.weight = 77;
    const HealthCheck3 = new HealthCheck("hc3");
    HealthCheck3.date = new Date("2020-09-30");
    HealthCheck3.height = 1.15;
    HealthCheck3.weight = 50;
    const childrenService = fixture.debugElement.injector.get(ChildrenService);
    spyOn(childrenService, "getHealthChecksOfChild").and.returnValue(
      of([HealthCheck1, HealthCheck2, HealthCheck3])
    );
    component.onInitFromDynamicConfig({
      entity: testChild,
      id: "",
      config: {},
    });
    expect(childrenService.getHealthChecksOfChild).toHaveBeenCalledWith(
      testChild.getId()
    );
    setTimeout(() => {
      expect(component.bmiValue).toEqual(HealthCheck2.bmi.toFixed(2));
      done();
    });
  });
});
