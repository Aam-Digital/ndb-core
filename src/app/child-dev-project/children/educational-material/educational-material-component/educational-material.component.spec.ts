import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EducationalMaterialComponent } from "./educational-material.component";
import { Child } from "../../model/child";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EducationalMaterial } from "../model/educational-material";
import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { of, Subject } from "rxjs";
import { UpdatedEntity } from "../../../../core/entity/model/entity-update";
import { ActivatedRoute } from "@angular/router";
import { RouteData } from "app/core/config/dynamic-routing/view-config.interface";

describe("EducationalMaterialComponent", () => {
  let component: EducationalMaterialComponent;
  let fixture: ComponentFixture<EducationalMaterialComponent>;
  const updates = new Subject<UpdatedEntity<EducationalMaterial>>();
  const child = new Child("22");
  const PENCIL: ConfigurableEnumValue = {
    id: "pencil",
    label: "Pencil",
  };
  const RULER: ConfigurableEnumValue = {
    id: "ruler",
    label: "Ruler",
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EducationalMaterialComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              config: {
                entity: "Child",
                panels: [
                  {
                    title: "Educational Materials",
                    summary: [
                      {
                        Total: "Total",
                      },
                      {
                        Average: "Average",
                      },
                    ],
                  },
                ],
              },
            }),
          },
        },
      ],
    }).compileComponents();

    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(updates);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EducationalMaterialComponent);
    component = fixture.componentInstance;
    component.entity = child;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("produces an empty summary when there are no records", () => {
    component.records = [];
    component.updateSummary();
    expect(component.summary).toHaveSize(0);
  });

  function setRecordsAndGenerateSummary(
    ...records: Partial<EducationalMaterial>[]
  ) {
    component.records = records.map(EducationalMaterial.create);
    component.updateSummary();
  }

  it("produces a singleton summary when there is a single record", () => {
    setRecordsAndGenerateSummary({ materialType: PENCIL, materialAmount: 1 });
    expect(component.summary).toEqual(`${PENCIL.label}: 1`);
  });

  it("produces a summary of all records when they are all different", () => {
    setRecordsAndGenerateSummary(
      { materialType: PENCIL, materialAmount: 2 },
      { materialType: RULER, materialAmount: 1 },
    );
    expect(component.summary).toEqual(`${PENCIL.label}: 2, ${RULER.label}: 1`);
  });

  it("produces a summary of all records when there are duplicates", () => {
    setRecordsAndGenerateSummary(
      { materialType: PENCIL, materialAmount: 1 },
      { materialType: RULER, materialAmount: 1 },
      { materialType: PENCIL, materialAmount: 3 },
    );
    expect(component.summary).toEqual(`${PENCIL.label}: 4, ${RULER.label}: 1`);
  });

  it("loads all education data associated with a child and updates the summary", async () => {
    const educationalData = [
      { materialType: PENCIL, materialAmount: 1, child: child.getId() },
      { materialType: RULER, materialAmount: 2, child: child.getId() },
    ].map(EducationalMaterial.create);
    spyOn(TestBed.inject(EntityMapperService), "loadType").and.resolveTo(
      educationalData,
    );
    component.entity = new Child("22");
    await component.ngOnInit();
    expect(component.summary).toEqual(`${PENCIL.label}: 1, ${RULER.label}: 2`);
    expect(component.records).toEqual(educationalData);
  });

  it("associates a new record with the current child", () => {
    const newRecord = component.newRecordFactory();
    expect(newRecord.child).toBe(child.getId());
  });
  it("produces an empty summary when there are no records", () => {
    component.records = [];
    component.updateSummary();
    expect(component.summary).toHaveSize(0);
  });

  it("should set summaryTitle based on panel title", () => {
    setRecordsAndGenerateSummary([{ Total: "Total" }, { Average: "Average" }])

    const routeData: RouteData = {
      config: {
        panels: [
          {
            title: "Educational Materials",
            summary: [
              {
                Total: "Total",
              },
              {
                Average: "Average",
              },
            ],
          },
        ],
      },
    };

    component.getSummaryList();
    expect(component.summaryTitle).toEqual([{ Total: "Total" }, { Average: "Average" }]);
  });

  it("should update the summary when entity updates are received", async () => {
    const update1 = EducationalMaterial.create({
      child: child.getId(),
      materialType: PENCIL,
      materialAmount: 1,
    });
    updates.next({ entity: update1, type: "new" });

    expect(component.records).toEqual([update1]);
    expect(component.summary).toBe(`${PENCIL.label}: 1`);

    const update2 = update1.copy() as EducationalMaterial;
    update2.materialAmount = 2;
    updates.next({ entity: update2, type: "update" });

    expect(component.records).toEqual([update2]);
    expect(component.summary).toBe(`${PENCIL.label}: 2`);

    const unrelatedUpdate = update1.copy() as EducationalMaterial;
    unrelatedUpdate.child = "differentChild";
    updates.next({ entity: unrelatedUpdate, type: "new" });
    // No change
    expect(component.records).toEqual([update2]);
    expect(component.summary).toBe(`${PENCIL.label}: 2`);
  });
});
