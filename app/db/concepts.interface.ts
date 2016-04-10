export abstract class AppDBSync {

    /**
     * External login (for example remote Couch DB authentication).
     *
     * @param username
     * @param password
     */
    abstract login(username:string, password:string):Promise;

    abstract logout():void;

    abstract registerErrorListener(callback:(err:AppDBError) => void):void;

    abstract registerResultListener(callback:(res:AppDBResult) => void):void;

}

export abstract class AppDB {

}

export class Entity {

    id:number;

    static find(id:number):Entity {
        return new Entity();
    };

    save():Promise {
        return new Promise();
    };

    delete():Promise {
        return new Promise();
    }

}


export interface AppDBError {

}

export interface AppDBResult {

}
