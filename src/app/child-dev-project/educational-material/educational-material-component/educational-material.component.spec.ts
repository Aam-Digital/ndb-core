import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EducationalMaterialComponent } from "./educational-material.component";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { ChildrenModule } from "../../children/children.module";
import { MockSessionModule } from "../../../core/session/mock-session.module";
import { EducationalMaterial } from "../model/educational-material";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";

describe("EducationalMaterialComponent", () => {
  let component: EducationalMaterialComponent;
  let fixture: ComponentFixture<EducationalMaterialComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const child = new Child("22");
  const PENCIL: ConfigurableEnumValue = {
    id: "pencil",
    label: "Pencil",
  };
  const RULER: ConfigurableEnumValue = {
    id: "ruler",
    label: "Ruler",
  };

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj([
        "getChild",
        "getEducationalMaterialsOfChild",
      ]);
      mockChildrenService.getChild.and.returnValue(of(child));
      mockChildrenService.getEducationalMaterialsOfChild.and.resolveTo([]);
      TestBed.configureTestingModule({
        declarations: [EducationalMaterialComponent],
        imports: [
          ChildrenModule,
          NoopAnimationsModule,
          MockSessionModule.withState(),
        ],
        providers: [
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EducationalMaterialComponent);
    component = fixture.componentInstance;
    component.child = child;
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
      { materialType: RULER, materialAmount: 1 }
    );
    expect(component.summary).toEqual(`${PENCIL.label}: 2, ${RULER.label}: 1`);
  });

  it("produces a summary of all records when there are duplicates", () => {
    setRecordsAndGenerateSummary(
      { materialType: PENCIL, materialAmount: 1 },
      { materialType: RULER, materialAmount: 1 },
      { materialType: PENCIL, materialAmount: 3 }
    );
    expect(component.summary).toEqual(`${PENCIL.label}: 4, ${RULER.label}: 1`);
  });

  it("loads all education data associated with a child and updates the summary", async () => {
    const educationalData = [
      { materialType: PENCIL, materialAmount: 1 },
      { materialType: RULER, materialAmount: 2 },
    ].map(EducationalMaterial.create);
    mockChildrenService.getEducationalMaterialsOfChild.and.resolveTo(
      educationalData
    );
    await component.loadData("22");
    expect(component.summary).toEqual(`${PENCIL.label}: 1, ${RULER.label}: 2`);
    expect(component.records).toEqual(educationalData);
  });

  it("associates a new record with the current child", () => {
    component.child = child;
    const newRecord = component.generateNewRecordFactory();
    expect(newRecord.child).toBe(child.getId());
  });
});
