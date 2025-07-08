import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityComponentSelectComponent } from "./entity-component-select-component";
import { MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EntityComponentSelectComponent", () => {
  let component: EntityComponentSelectComponent;
  let fixture: ComponentFixture<EntityComponentSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityComponentSelectComponent, FontAwesomeTestingModule],
      providers: [{ provide: MatDialogRef, useValue: { close: () => null } }],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityComponentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
