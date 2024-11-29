import { TestBed } from '@angular/core/testing';

import { EscoApiService } from './esco-api.service';

describe('EscoApiService', () => {
  let service: EscoApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EscoApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
