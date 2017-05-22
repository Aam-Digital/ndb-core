import { User } from './user';
describe('User', () => {

  it('has ID with correct prefix', function () {
    const id = 'test1';
    const user = new User(id);

    expect(user.getId()).toBe(user.getPrefix() + id);
  });


  it('accepts valid password', function () {
    const id = 'test1';
    const user = new User(id);
    const password = 'pass';
    user.setNewPassword(password);

    expect(user.checkPassword(password)).toBeTruthy();
  });

  it('rejects wrong password', function () {
    const id = 'test1';
    const user = new User(id);
    const password = 'pass';
    user.setNewPassword(password);

    expect(user.checkPassword(password + 'x')).toBeFalsy();
  });

});
