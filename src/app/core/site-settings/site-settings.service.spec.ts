import { TestBed } from '@angular/core/testing';

import { SiteSettingsService } from './site-settings.service';

describe('SiteSettingsService', () => {
  let service: SiteSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiteSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
