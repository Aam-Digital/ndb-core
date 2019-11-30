import { Injectable } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

@Injectable()
export class MockBlobService {

  constructor() {
  }

  getImage(path: string): Promise<SafeUrl> {
    return new Promise((resolve, reject) => {resolve('assets/child.png'); });
  }
}
