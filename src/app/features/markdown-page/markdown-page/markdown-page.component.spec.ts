import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MarkdownPageComponent } from "./markdown-page.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { MarkdownPageConfig } from "../MarkdownPageConfig";
import { DynamicComponentConfig } from "../../../core/config/dynamic-components/dynamic-component-config.interface";
import { MarkdownPageModule } from "../markdown-page.module";
import { ComponentRegistry } from "../../../dynamic-components";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "app/core/entity/entity-mapper/mock-entity-mapper-service";

describe("MarkdownPageComponent", () => {
  let component: MarkdownPageComponent;
  let fixture: ComponentFixture<MarkdownPageComponent>;

  let mockRouteData: BehaviorSubject<
    DynamicComponentConfig<MarkdownPageConfig>
  >;

  beforeEach(waitForAsync(() => {
    mockRouteData = new BehaviorSubject({
      config: { markdownFile: "test.md" },
    });

    TestBed.configureTestingModule({
      imports: [MarkdownPageModule, MarkdownPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: mockRouteData } },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        ComponentRegistry,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
