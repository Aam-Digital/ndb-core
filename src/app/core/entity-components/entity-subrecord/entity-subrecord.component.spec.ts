import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EntitySubrecordComponent } from "./entity-subrecord.component";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "./entity-subrecord.module";
import { MockDatabase } from "../../database/mock-database";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../database/database";
import { Entity } from "../../entity/entity";
import { ColumnDescription } from "./column-description";
import { ColumnDescriptionInputType } from "./column-description-input-type.enum";
import { By } from "@angular/platform-browser";
import { SimpleChange } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material/core";

fdescribe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent;
  let fixture: ComponentFixture<EntitySubrecordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        EntitySubrecordModule,
        RouterTestingModule,
        MatNativeDateModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: Database, useClass: MockDatabase },
        {
          provide: ConfirmationDialogService,
          useClass: ConfirmationDialogService,
        },
      ],
    }).compileComponents();
  }));

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
      new ColumnDescription(
        "text",
        "Test Text",
        ColumnDescriptionInputType.TEXT
      ),
      new ColumnDescription(
        "textarea",
        "Test Area",
        ColumnDescriptionInputType.TEXTAREA
      ),
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
});
