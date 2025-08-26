import { TestBed } from '@angular/core/testing';

import { DashboardWidgetRegistryService } from './dashboard-widget-registry.service';

describe('DashboardWidgetRegistryService', () => {
  let service: DashboardWidgetRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardWidgetRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
