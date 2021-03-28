import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntitySelectComponent } from "./entity-select.component";

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any>;
  let fixture: ComponentFixture<EntitySelectComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntitySelectComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
