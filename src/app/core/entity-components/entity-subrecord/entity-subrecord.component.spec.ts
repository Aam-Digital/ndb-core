import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EntitySubrecordComponent } from "./entity-subrecord.component";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "./entity-subrecord.module";
import { Entity } from "../../entity/entity";
import { ColumnDescriptionInputType } from "./column-description-input-type.enum";
import { By } from "@angular/platform-browser";
import { SimpleChange } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material/core";
import { DatePipe, PercentPipe } from "@angular/common";
import { EntityMapperService } from "../../entity/entity-mapper.service";

describe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent<Entity>;
  let fixture: ComponentFixture<EntitySubrecordComponent<Entity>>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj(["remove", "save"]);

      TestBed.configureTestingModule({
        imports: [
          EntitySubrecordModule,
          RouterTestingModule,
          MatNativeDateModule,
          NoopAnimationsModule,
        ],
        providers: [
          DatePipe,
          PercentPipe,
          { provide: EntityMapperService, useValue: mockEntityMapper },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySubrecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("displays empty text instead of 'undefined' in textbox", () => {
    component.records = [
      Object.assign(new Entity(), { text: "foo", textarea: "foo" }),
      Object.assign(new Entity(), { text: undefined, textarea: undefined }),
    ];

    component.columns = [
      {
        name: "text",
        label: "Test text",
        inputType: ColumnDescriptionInputType.TEXT,
      },
      {
        name: "textarea",
        label: "Test textarea",
        inputType: ColumnDescriptionInputType.TEXTAREA,
      },
    ];
    component.ngOnChanges({
      records: new SimpleChange(undefined, component.records, true),
      columns: new SimpleChange(undefined, component.columns, true),
    });

    component.recordsEditing.set(component.records[0].getId(), true);
    component.recordsEditing.set(component.records[1].getId(), true);
    fixture.detectChanges();

    const inputFields = fixture.debugElement.queryAll(By.css("input"));
    expect(inputFields[0].nativeElement.value).toBe("foo");
    expect(inputFields[1].nativeElement.value).toBe("");

    const textareaFields = fixture.debugElement.queryAll(By.css("textarea"));
    expect(textareaFields[0].nativeElement.value).toBe("foo");
    expect(textareaFields[1].nativeElement.value).toBe("");
  });

  it("apply formatter function to values in read mode if formatter is given", () => {
    component.records = [
      Object.assign(new Entity(), { simple: 0.9, percent: 0.9 }),
    ];

    component.columns = [
      {
        name: "simple",
        label: "Test simple",
        inputType: ColumnDescriptionInputType.NUMBER,
      },
      {
        name: "percent",
        label: "Test formatted",
        inputType: ColumnDescriptionInputType.NUMBER,
        valueFunction: (entity) => entity["percent"] * 100 + "%",
      },
    ];
    component.ngOnChanges({
      records: new SimpleChange(undefined, component.records, true),
      columns: new SimpleChange(undefined, component.columns, true),
    });
    fixture.detectChanges();

    const tdColumns = fixture.debugElement.queryAll(By.css("td"));
    expect(tdColumns[0].nativeElement.innerText).toBe("0.9");
    expect(tdColumns[1].nativeElement.innerText).toBe("90%");
  });

  it("formats MONTH and DATE automatically", () => {
    component.records = [
      Object.assign(new Entity(), {
        month: new Date("2020-01-01"),
        day: new Date("2020-01-23"),
      }),
    ];

    component.columns = [
      {
        name: "month",
        label: "Test month",
        inputType: ColumnDescriptionInputType.MONTH,
      },
      {
        name: "day",
        label: "Test day",
        inputType: ColumnDescriptionInputType.DATE,
      },
    ];
    component.ngOnChanges({
      records: new SimpleChange(undefined, component.records, true),
      columns: new SimpleChange(undefined, component.columns, true),
    });
    fixture.detectChanges();

    const tdColumns = fixture.debugElement.queryAll(By.css("td"));
    expect(tdColumns[0].nativeElement.innerText).toBe("2020-01");
    expect(tdColumns[1].nativeElement.innerText).toBe("2020-01-23");
  });
});
