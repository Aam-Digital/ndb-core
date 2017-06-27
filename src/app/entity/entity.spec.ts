import { Entity } from './entity';

describe('Entity', () => {

  it('has ID', function () {
    const id = 'test1';
    const entity = new Entity(id);

    expect(entity.getId()).toBe(id);
  });

});
