import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../core/alerts/alert.service";

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;

  beforeEach(
    waitForAsync(() => {
      const mockEntityService = jasmine.createSpyObj("mockEntityService", [
        "load",
        "save",
      ]);
      mockEntityService.load.and.resolveTo({ title: "test", parts: [] });

      TestBed.configureTestingModule({
        declarations: [ProgressDashboardComponent],
        imports: [
          MatIconModule,
          MatFormFieldModule,
          MatInputModule,
          MatButtonModule,
          MatCardModule,
          MatProgressBarModule,
          CommonModule,
          FormsModule,
        ],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityService },
          {
            provide: AlertService,
            useValue: jasmine.createSpyObj([
              "addDebug",
              "addInfo",
              "addWarning",
            ]),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
