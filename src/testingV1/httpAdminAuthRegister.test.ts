import { requestClear, requestAuthRegister } from '../requestHelpers';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
});

describe('/v1/admin/auth/register tests', () => {
  describe('Success Cases', () => {
    test.each([
      { email: 'jane.citizen@gmail.com', password: 'abcd1234', nameFirst: 'jane', nameLast: 'citizen' },
      { email: 'jake@yahoo.com', password: 'abcd1234', nameFirst: 'jake', nameLast: 'citizen' },
      { email: 'jane.citizen@gmail.com', password: 'a1#$#@$%!^#', nameFirst: 'jane', nameLast: 'citizen' },
      { email: 'jane.citizen@gmail.com', password: 'abcd1234', nameFirst: 'Jane-smith\'', nameLast: 'citizen' },
      { email: 'jane.citizen@gmail.com', password: 'abcd1234', nameFirst: 'jane', nameLast: 'Smith citizen' },
    ])('valid registrations', ({ email, password, nameFirst, nameLast }) => {
      const requestObj = requestAuthRegister(email, password, nameFirst, nameLast);
      expect(requestObj.retValue).toStrictEqual({ token: expect.any(String) });
      expect(requestObj.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    test('Email used by another user', () => {
      requestAuthRegister('a.b@gmail.com', 'abcd1234', 'aa', 'bb');
      const user2 = requestAuthRegister('a.b@gmail.com', 'abcd1234', 'bb', 'cc');
      expect(user2.retValue).toStrictEqual(ERROR);
      expect(user2.statusCode).toStrictEqual(400);
    });

    test('invalid Email', () => {
      const user1 = requestAuthRegister('hello', 'abcd1234', 'aa', 'bb');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test.each([
      { nameFirst: 'j@ne' },
      { nameFirst: 'j>ne' },
      { nameFirst: 'jane/' },
      { nameFirst: 'jane1234' },
    ])("nameFirst contains disallowed characters: '$nameFirst'", ({ nameFirst }) => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'abcd1234', nameFirst, 'bb');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('nameFirst too short', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'abcd1234', 'a', 'bb');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('nameFirst too long', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'abcd1234', 'asdfasdfasdfasdfasdfa', 'cc');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test.each([
      { nameLast: 'j@ne' },
      { nameLast: 'j>ne' },
      { nameLast: 'jane/' },
      { nameLast: 'jane1234' },
    ])("nameLast contains disallowed characters: '$nameLast'", ({ nameLast }) => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'abcd1234', 'aa', nameLast);
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('nameLast too short', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'abcd1234', 'bb', 'a');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('nameLast too long', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'abcd1234', 'bb', 'asdfasdfasdfasdfasdfa');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('Password less than 8 characters', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'a1', 'bb', 'aa');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('Password no number', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', 'ASDFasdf', 'bb', 'aa');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('Password no letter', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', '12345678', 'bb', 'aa');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });

    test('Password no number and letter', () => {
      const user1 = requestAuthRegister('a.b@gmail.com', '!@#$%^&*', 'bb', 'aa');
      expect(user1.retValue).toStrictEqual(ERROR);
      expect(user1.statusCode).toStrictEqual(400);
    });
  });
});
