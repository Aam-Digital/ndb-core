import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMenuComponent } from './admin-menu.component';
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';

describe("AdminMenuComponent", () => {
  let component: AdminMenuComponent;
  let fixture: ComponentFixture<AdminMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenuComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: MenuService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
