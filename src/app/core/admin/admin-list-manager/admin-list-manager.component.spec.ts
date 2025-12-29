import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminListManagerComponent } from "./admin-list-manager.component";
import { SyncStateSubject } from "../../session/session-type";
import { CurrentUserSubject } from "../../session/current-user-subject";
import {
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";

describe("AdminListManagerComponent", () => {
  let component: AdminListManagerComponent;
  let fixture: ComponentFixture<AdminListManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminListManagerComponent],
      providers: [
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        SyncStateSubject,
        CurrentUserSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminListManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
