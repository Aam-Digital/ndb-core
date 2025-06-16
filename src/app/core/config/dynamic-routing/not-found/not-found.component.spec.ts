import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotFoundComponent } from "./not-found.component";
import { RouterTestingModule } from "@angular/router/testing";
import { LOCATION_TOKEN } from "../../../../utils/di-tokens";
import { Logging } from "../../../logging/logging.service";

describe("NotFoundComponent", () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    spyOn(Logging, "debug");
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterTestingModule],
      providers: [
        { provide: LOCATION_TOKEN, useValue: { pathname: "/some/path" } },
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
    expect(Logging.debug).toHaveBeenCalledWith(
      "Could not find route: /some/path",
    );
  });
});
