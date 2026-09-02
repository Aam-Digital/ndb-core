import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminMenuComponent } from "./admin-menu.component";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminMenuComponent", () => {
  let component: AdminMenuComponent;
  let fixture: ComponentFixture<AdminMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenuComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: {
            // must resolve to a Config-shaped object: the component awaits this in
            // ngOnInit and Angular 22 surfaces the rejection as an uncaught error
            load: vi.fn().mockResolvedValue({
              data: { navigationMenu: { items: [] } },
            }),
          },
        },
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
