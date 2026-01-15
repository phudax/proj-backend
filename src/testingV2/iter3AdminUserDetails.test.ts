import { requestAuthLogin, requestAuthRegister, requestClear, requestUserDetails } from '../requestHelpers';
import { requestUserDetailsV2 } from '../iter3RequestHelpers';
const ERROR = { error: expect.any(String) };

type token = {
  token: string;
}
let user: token;
beforeEach(() => {
  requestClear();
  user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
});

describe('test for errors', () => {
  test('token is not valid structure', () => {
    const details = requestUserDetailsV2(undefined);
    expect(details.retValue).toStrictEqual(ERROR);
    expect(details.statusCode).toStrictEqual(401);
  });

  test('token is not a valid user', () => {
    expect(requestUserDetailsV2(user.token + 1).retValue).toStrictEqual(ERROR);
    expect(requestUserDetailsV2(user.token + 1).statusCode).toStrictEqual(403);
  });
});

describe('When token is valid', () => {
  test('token is a valid user', () => {
    expect(requestUserDetailsV2(user.token).retValue).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Phu Dang',
        email: 'phudang@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
    expect(requestUserDetailsV2(user.token).statusCode).toStrictEqual(200);
  });
});

describe('When user has multiple Successful Logins', () => {
  test('token is a valid user', () => {
    requestAuthLogin('phudang@gmail.com', 'z5418123');
    requestAuthLogin('phudang@gmail.com', 'z5418123');
    requestAuthLogin('phudang@gmail.com', 'z5418123');
    expect(requestUserDetailsV2(user.token).retValue).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Phu Dang',
        email: 'phudang@gmail.com',
        numSuccessfulLogins: 4,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
    expect(requestUserDetailsV2(user.token).statusCode).toStrictEqual(200);
  });
});

describe('When user has multiple failed Logins', () => {
  test('Login with wrong password', () => {
    requestAuthLogin('phudang@gmail.com', 'z541812');
    requestAuthLogin('phudang@gmail.com', 'z541123');
    requestAuthLogin('phudang@gmail.com', 'z418123');
    expect(requestUserDetailsV2(user.token).retValue).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Phu Dang',
        email: 'phudang@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 3,
      }
    });
    expect(requestUserDetailsV2(user.token).statusCode).toStrictEqual(200);
  });
});

describe('When user has failed logins but then has a Successful one at the end', () => {
  test('login incorrect then correct ', () => {
    requestAuthLogin('phudang@gmail.com', 'z541812');
    requestAuthLogin('phudang@gmail.com', 'z541123');
    requestAuthLogin('phudang@gmail.com', 'z418123');
    requestAuthLogin('phudang@gmail.com', 'z5418123');
    expect(requestUserDetailsV2(user.token).retValue).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Phu Dang',
        email: 'phudang@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
    expect(requestUserDetailsV2(user.token).statusCode).toStrictEqual(200);
  });
});

describe('Tests to show that failed logins reset ', () => {
  test('login incorrect then correct then incorrect', () => {
    requestAuthLogin('phudang@gmail.com', 'z541812');
    requestAuthLogin('phudang@gmail.com', 'z541123');
    requestAuthLogin('phudang@gmail.com', 'z418123');
    requestAuthLogin('phudang@gmail.com', 'z5418123');
    requestAuthLogin('phudang@gmail.com', 'zeeee');
    expect(requestUserDetailsV2(user.token).retValue).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Phu Dang',
        email: 'phudang@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 1,
      }
    });
    expect(requestUserDetailsV2(user.token).statusCode).toStrictEqual(200);
  });
});

describe('test for iteration 2 coverage', () => {
  test('token is a valid user', () => {
    expect(requestUserDetails(user.token).retValue).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Phu Dang',
        email: 'phudang@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
    expect(requestUserDetailsV2(user.token).statusCode).toStrictEqual(200);
  });
});
