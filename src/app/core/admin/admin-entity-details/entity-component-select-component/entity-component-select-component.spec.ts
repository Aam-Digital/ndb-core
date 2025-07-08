import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityComponentSelectComponent } from "./entity-component-select-component";

fdescribe("EntityComponentSelectComponent", () => {
  let component: EntityComponentSelectComponent;
  let fixture: ComponentFixture<EntityComponentSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityComponentSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityComponentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
