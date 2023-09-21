import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MarkdownPageComponent } from "./markdown-page.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { MarkdownPageConfig } from "../MarkdownPageConfig";
import { RouteData } from "../../../core/config/dynamic-routing/view-config.interface";
import { MarkdownPageModule } from "../markdown-page.module";
import { ComponentRegistry } from "../../../dynamic-components";

describe("MarkdownPageComponent", () => {
  let component: MarkdownPageComponent;
  let fixture: ComponentFixture<MarkdownPageComponent>;

  let mockRouteData: BehaviorSubject<RouteData<MarkdownPageConfig>>;

  beforeEach(waitForAsync(() => {
    mockRouteData = new BehaviorSubject({
      config: { markdownFile: "test.md" },
    });

    TestBed.configureTestingModule({
      imports: [MarkdownPageModule, MarkdownPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: mockRouteData } },
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
