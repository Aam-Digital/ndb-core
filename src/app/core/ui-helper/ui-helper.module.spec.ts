import { UiHelperModule } from './ui-helper.module';

describe('UiHelperModule', () => {
  let uiComponentsModule: UiHelperModule;

  beforeEach(() => {
    uiComponentsModule = new UiHelperModule();
  });

  it('should create an instance', () => {
    expect(uiComponentsModule).toBeTruthy();
  });
});
