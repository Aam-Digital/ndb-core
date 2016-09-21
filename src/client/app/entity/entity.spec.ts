import { Entity } from './entity';

export function main() {
    describe('entity tests', () => {

        it('has ID', function () {
            let id = 'test1';
            let entity = new Entity(id);

            expect(entity.getId()).toBe(id);
        });

    });
}
