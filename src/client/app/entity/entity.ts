/**
 * Entity is a base class for all domain model classes.
 *
 * Entity does not deal with database actions. Inject `EntityMapperService` and use its find/save/delete functions.
 */
export class Entity {

    private _id: string;

    constructor(id: string) {
        this.setId(id);
    }


    public getPrefix(): string {
        return '';
    }

    public getId(): string {
        return this._id;
    }

    private setId(id: string) {
        if (!id.startsWith(this.getPrefix())) {
            id = this.getPrefix() + id;
        }
        this._id = id;
    }
}
