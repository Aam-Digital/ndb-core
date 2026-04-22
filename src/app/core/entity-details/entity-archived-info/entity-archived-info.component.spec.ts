import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityArchivedInfoComponent } from "./entity-archived-info.component";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EMPTY } from "rxjs";

describe("EntityArchivedInfoComponent", () => {
  let component: EntityArchivedInfoComponent;
  let fixture: ComponentFixture<EntityArchivedInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EntityArchivedInfoComponent],
      providers: [
        { provide: EntityActionsService, useValue: null },
        {
          provide: EntityMapperService,
          useValue: {
            receiveUpdates: vi.fn().mockReturnValue(EMPTY),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(EntityArchivedInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
