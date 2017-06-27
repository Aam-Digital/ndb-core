import { NdbCorePage } from './app.po';

describe('ndb-core App', () => {
  let page: NdbCorePage;

  beforeEach(() => {
    page = new NdbCorePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
