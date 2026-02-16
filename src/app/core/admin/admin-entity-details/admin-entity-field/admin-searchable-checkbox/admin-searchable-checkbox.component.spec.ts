import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminSearchableCheckboxComponent } from "./admin-searchable-checkbox.component";
import { Entity } from "../../../../entity/model/entity";
import { DatabaseField } from "../../../../entity/database-field.decorator";
import { ComponentRef } from "@angular/core";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminSearchableCheckboxComponent", () => {
  let component: AdminSearchableCheckboxComponent;
  let componentRef: ComponentRef<AdminSearchableCheckboxComponent>;
  let fixture: ComponentFixture<AdminSearchableCheckboxComponent>;

  class TestEntity extends Entity {
    @DatabaseField() name: string;
    @DatabaseField() age: number;
    @DatabaseField() description: string;

    static override toStringAttributes = ["name"];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSearchableCheckboxComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSearchableCheckboxComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput("entityType", TestEntity);
    componentRef.setInput("fieldId", "age");
    componentRef.setInput("dataType", "number");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should recognize searchable data types", () => {
    componentRef.setInput("dataType", "string");
    fixture.detectChanges();
    expect(component.isSearchableDataType()).toBe(true);

    componentRef.setInput("dataType", "number");
    fixture.detectChanges();
    expect(component.isSearchableDataType()).toBe(true);

    componentRef.setInput("dataType", "configurable-enum");
    fixture.detectChanges();
    expect(component.isSearchableDataType()).toBe(false);
  });

  it("should detect implicitly searchable fields", () => {
    componentRef.setInput("fieldId", "name");
    fixture.detectChanges();
    expect(component.isImplicitlySearchable()).toBe(true);

    componentRef.setInput("fieldId", "age");
    fixture.detectChanges();
    expect(component.isImplicitlySearchable()).toBe(false);
  });

  it("should show implicit searchable note when field is in toStringAttributes and not checked", () => {
    component.ngOnInit();
    componentRef.setInput("fieldId", "name");
    componentRef.setInput("dataType", "string");
    component.writeValue(false, false);
    fixture.detectChanges();
    expect(component.showImplicitSearchableNote()).toBe(true);

    component.writeValue(true, false);
    fixture.detectChanges();
    expect(component.showImplicitSearchableNote()).toBe(false);
  });

  it("should disable control for non-searchable data types", () => {
    component.ngOnInit();
    componentRef.setInput("dataType", "configurable-enum");
    component.writeValue(true, false);
    fixture.detectChanges();

    expect(component.searchableControl.disabled).toBe(true);
    expect(component.searchableControl.value).toBe(false);
  });

  it("should enable control for searchable data types", () => {
    component.ngOnInit();
    componentRef.setInput("dataType", "string");
    component.writeValue(false, false);
    fixture.detectChanges();

    expect(component.searchableControl.disabled).toBe(false);
  });
});
