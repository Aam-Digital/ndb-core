import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityArchivedInfoComponent } from "./entity-archived-info.component";
import { EntityRemoveService } from "../../entity/entity-remove.service";

describe("EntityArchivedInfoComponent", () => {
  let component: EntityArchivedInfoComponent;
  let fixture: ComponentFixture<EntityArchivedInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EntityArchivedInfoComponent],
      providers: [{ provide: EntityRemoveService, useValue: null }],
    });
    fixture = TestBed.createComponent(EntityArchivedInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
