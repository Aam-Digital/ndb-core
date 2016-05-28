import { Entity } from "../model/entity";


export class User extends Entity {

    public name: string;
    private password: any;


    public checkPassword(givenPassword: string): boolean {
        return (this.hashPassword(givenPassword) == this.password.hash);
    }

    private hashPassword(givenPassword: string): string {
        let options = {
            keySize: this.password.keysize,
            iterations: this.password.iterations
        };

        return CryptoJS.PBKDF2(givenPassword, this.password.salt, options).toString();
    }




    public getPrefix(): string {
        return "user:";
    }
}
