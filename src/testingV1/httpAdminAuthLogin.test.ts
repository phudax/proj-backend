import { requestClear, requestAuthRegister, requestAuthLogin } from '../requestHelpers';
const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
});

describe('adminAuthLogin tests', () => {
  describe('Success Cases', () => {
    test('Successful login', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const login1 = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234');
      expect(login1.retValue).toStrictEqual({ token: expect.any(String) });
      expect(login1.statusCode).toStrictEqual(200);
    });
  });
  describe('Error Cases', () => {
    beforeEach(() => {
      requestAuthRegister('jane1.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
    });
    test('Email address does not exist', () => {
      const login1 = requestAuthLogin('john.citizen@gmail.com', 'abcd1234');
      expect(login1.retValue).toStrictEqual(ERROR);
      expect(login1.statusCode).toStrictEqual(400);
    });

    test('Password is not correct for the given email', () => {
      const login1 = requestAuthLogin('jane1.citizen@gmail.com', 'abcd12345');
      expect(login1.retValue).toStrictEqual(ERROR);
      expect(login1.statusCode).toStrictEqual(400);
    });
  });
});
