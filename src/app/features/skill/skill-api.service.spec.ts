import { TestBed } from '@angular/core/testing';

import { SkillApiService } from './skill-api.service';

describe('SkillApiService', () => {
  let service: SkillApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkillApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
