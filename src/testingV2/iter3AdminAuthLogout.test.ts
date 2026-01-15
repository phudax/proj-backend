import { requestClear, requestAuthRegister, requestAuthLogin, requestUserDetails, requestAuthLogout } from '../requestHelpers';
import { requestAuthLogoutV2 } from '../iter3RequestHelpers';

const OK = 200;
const INPUT_ERROR = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

beforeEach(() => {
  requestClear();
});

describe('/v2/admin/auth/logout tests', () => {
  describe('Success Cases', () => {
    test('Successful logout after register', () => {
      const user1 = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      const logout1 = requestAuthLogoutV2(user1.token);
      expect(logout1.statusCode).toBe(OK);
      expect(logout1.retValue).toStrictEqual({});
    });
    test('Successful logout after register and then login', () => {
      const user1 = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      const loginSession = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue;
      const logout1 = requestAuthLogoutV2(user1.token);
      const logout2 = requestAuthLogoutV2(loginSession.token);
      expect(logout1.retValue).toStrictEqual({});
      expect(logout1.statusCode).toBe(OK);
      expect(logout2.retValue).toStrictEqual({});
      expect(logout2.statusCode).toBe(OK);
    });
  });
  describe('Error Cases', () => {
    test('trying to logout user after already logged out', () => {
      const user1 = requestAuthRegister('jane1.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      const token = user1.token;
      requestAuthLogoutV2(user1.token);
      const logout1 = requestAuthLogoutV2(token);
      expect(logout1.retValue).toStrictEqual({ error: expect.any(String) });
      expect(logout1.statusCode).toBe(INPUT_ERROR);
    });

    test('trying to logout with no users registered', () => {
      const logout1 = requestAuthLogoutV2('randomToken');
      expect(logout1.retValue.error).toStrictEqual(expect.any(String));
      expect(logout1.statusCode).toBe(INPUT_ERROR);
    });

    test('logout stops other function using already logged out token', () => {
      const user1 = requestAuthRegister('jane1.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      requestAuthLogoutV2(user1.token);
      const details1 = requestUserDetails(user1.token);
      expect(details1.retValue.error).toStrictEqual(expect.any(String));
      expect(details1.statusCode).toBe(FORBIDDEN);
    });

    test.each([
      { token: undefined },
    ])('token is not a valid structure', ({ token }) => {
      const logout1 = requestAuthLogoutV2(token as any);
      expect(logout1.retValue.error).toStrictEqual(expect.any(String));
      expect(logout1.statusCode).toBe(UNAUTHORIZED);
    });
  });
});

describe('/v1/admin/auth/logout tests for ITERATION 2 COVERAGE', () => {
  test('Successful logout after register', () => {
    const user1 = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
    const logout1 = requestAuthLogout(user1.token);
    expect(logout1.statusCode).toBe(OK);
    expect(logout1.retValue).toStrictEqual({});
  });
});
