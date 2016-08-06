import { User } from "./user";

describe('user tests', () => {

    it('has ID with correct prefix', function () {
        let id = "test1";
        let user = new User(id);

        expect(user.getId()).toBe(user.getPrefix() + id);
    });


    it('accepts valid password', function () {
        let id = "test1";
        let user = new User(id);
        let password = "pass";
        user.setNewPassword(password);

        expect(user.checkPassword(password)).toBeTruthy();
    });

    it('rejects wrong password', function () {
        let id = "test1";
        let user = new User(id);
        let password = "pass";
        user.setNewPassword(password);

        expect(user.checkPassword(password + "x")).toBeFalsy();
    });

});
