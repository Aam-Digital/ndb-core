import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminEntityPublicFormsComponent } from "./admin-entity-public-forms-component";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { componentRegistry, ComponentRegistry } from "app/dynamic-components";

describe("AdminEntityPublicFormsComponent", () => {
  let component: AdminEntityPublicFormsComponent;
  let fixture: ComponentFixture<AdminEntityPublicFormsComponent>;
  const mockEntityConstructor: EntityConstructor = class MockEntity extends Entity {
    constructor(public id?: string) {
      super(id);
    }
  };
  mockEntityConstructor.ENTITY_TYPE = "Child";
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [AdminEntityPublicFormsComponent],
      providers: [{ provide: ComponentRegistry, useValue: componentRegistry }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEntityPublicFormsComponent);
    component = fixture.componentInstance;
    component.entityConstructor = mockEntityConstructor;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });
});
