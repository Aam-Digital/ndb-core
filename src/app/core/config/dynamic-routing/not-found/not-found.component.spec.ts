import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotFoundComponent } from "./not-found.component";
import { RouterTestingModule } from "@angular/router/testing";
import { LOCATION_TOKEN } from "../../../../utils/di-tokens";
import { LoggingService } from "../../../logging/logging.service";

describe("NotFoundComponent", () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;
  let mockLogging: jasmine.SpyObj<LoggingService>;

  beforeEach(async () => {
    mockLogging = jasmine.createSpyObj(LoggingService.name, ["warn"]);
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterTestingModule],
      providers: [
        { provide: LOCATION_TOKEN, useValue: { pathname: "/some/path" } },
        { provide: LoggingService, useValue: mockLogging },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call logging service with current route", () => {
    expect(mockLogging.warn).toHaveBeenCalledWith(
      "Could not find component for route: /some/path",
    );
  });
});
