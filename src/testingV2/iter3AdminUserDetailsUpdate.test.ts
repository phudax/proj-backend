import { requestClear, requestAuthRegister, requestUserDetails, requestUserDetailsUpdate } from '../requestHelpers';
import { requestUserDetailsUpdateV2 } from '../iter3RequestHelpers';
type token = {
  token: string;
}
type error = {
  error: string;
}
type requestReturn = {
  retValue: Record<string, never> | error;
  statusCode: number;
}
let user: token;
let update: requestReturn;
const ERROR = { error: expect.any(String) };
beforeEach(() => {
  requestClear();
  user = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
});

describe('/v1/admin/user/details (update details) test', () => {
  describe('Error cases', () => {
    test('Email is in use by another user (excluding current user)', () => {
      requestAuthRegister('apple@gmail.com', 'apwonf2314', 'Greg', 'Smith');
      update = requestUserDetailsUpdateV2(user.token, 'apple@gmail.com', 'Hayden', 'Smith');
      expect(update.statusCode).toStrictEqual(400);
    });

    test('Email is not valid', () => {
      update = requestUserDetailsUpdateV2(user.token, 'invalidemail', 'Hayden', 'Smith');
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test.each([
      { nameFirst: 'j@ne' },
      { nameFirst: 'j>ne' },
      { nameFirst: 'jane/' },
      { nameFirst: 'jane1234' },
    ])('nameFirst contains disallowed characters', ({ nameFirst }) => {
      update = requestUserDetailsUpdateV2(user.token, 'a.b@gmail.com', nameFirst, 'Smith');
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test.each([
      { nameFirst: 'a' },
      { nameFirst: 'D' },
      { nameFirst: 'a'.repeat(21) },
    ])('nameFirst is of invalid length', ({ nameFirst }) => {
      update = requestUserDetailsUpdateV2(user.token, 'a.b@gmail.com', nameFirst, 'Smith');
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test.each([
      { nameLast: 'j@ne' },
      { nameLast: 'j>ne' },
      { nameLast: 'jane/' },
      { nameLast: 'jane1234' },
    ])('nameFirst contains disallowed characters', ({ nameLast }) => {
      update = requestUserDetailsUpdateV2(user.token, 'a.b@gmail.com', 'Hayden', nameLast);
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test.each([
      { nameLast: 'a' },
      { nameLast: 'D' },
      { nameLast: 'a'.repeat(21) },
    ])('nameLast is of invalid length', ({ nameLast }) => {
      update = requestUserDetailsUpdateV2(user.token, 'a.b@gmail.com', 'Hayden', nameLast);
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test('token invalid structure', () => {
      update = requestUserDetailsUpdateV2(undefined, 'banana@gmail.com', 'Hayden', 'Smith');
      expect(update.statusCode).toStrictEqual(401);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test('Token is not of a currently logged in session', () => {
      update = requestUserDetailsUpdateV2(user.token + 1, 'banana@gmail.com', 'Hayden', 'Smith');
      expect(update.statusCode).toStrictEqual(403);
      expect(update.retValue).toStrictEqual(ERROR);
    });
  });

  describe('Success Cases - check return values', () => {
    test.each([
      { email: 'jane.citizen@gmail.com', nameFirst: 'jane', nameLast: 'citizen' },
      { email: 'jake@yahoo.com', nameFirst: 'jake', nameLast: 'citizen' },
      { email: 'jane.citizen@gmail.com', nameFirst: 'jane', nameLast: 'citizen' },
      { email: 'jane.citizen@gmail.com', nameFirst: 'Jane-smith\'', nameLast: 'citizen' },
      { email: 'jane.citizen@gmail.com', nameFirst: 'jane', nameLast: 'Smith citizen' },
    ])('valid registrations', ({ email, nameFirst, nameLast }) => {
      update = requestUserDetailsUpdateV2(user.token, email, nameFirst, nameLast);
      expect(update.retValue).toStrictEqual({});
      expect(update.statusCode).toStrictEqual(200);
    });
  });

  describe('Success Cases - check stored data for change', () => {
    test('User updates his details twice', () => {
      requestUserDetailsUpdateV2(user.token, 'apple@gmail.com', 'Bobby', 'Smith');
      let userDetails = requestUserDetails(user.token).retValue;
      expect(userDetails.user.name).toStrictEqual('Bobby Smith');
      expect(userDetails.user.email).toStrictEqual('apple@gmail.com');
      requestUserDetailsUpdateV2(user.token, 'banana@gmail.com', 'Michael', 'Angelo');
      userDetails = requestUserDetails(user.token).retValue;
      expect(userDetails.user.name).toStrictEqual('Michael Angelo');
      expect(userDetails.user.email).toStrictEqual('banana@gmail.com');
    });
  });
});
describe('/v1/admin/user/details ITERATION 2 TEST', () => {
  test('Invalid token', () => {
    update = requestUserDetailsUpdate(user.token, 'apple@gmail.com', 'Bobby', 'Smith');
    expect(update.statusCode).toStrictEqual(200);
    expect(update.retValue).toStrictEqual({});
  });

  test('Email is not valid', () => {
    update = requestUserDetailsUpdate(user.token, 'invalidemail', 'Hayden', 'Smith');
    expect(update.statusCode).toStrictEqual(400);
    expect(update.retValue).toStrictEqual(ERROR);
  });
});
