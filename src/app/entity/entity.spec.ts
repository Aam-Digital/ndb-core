import { Entity } from './entity';

describe('Entity', () => {

  it('has ID', function () {
    let id = 'test1';
    let entity = new Entity(id);

    expect(entity.getId()).toBe(id);
  });

});
