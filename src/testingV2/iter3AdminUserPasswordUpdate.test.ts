import {
  requestUserPasswordUpdate,
  requestClear,
  requestAuthRegister,
  requestAuthLogin,
} from '../requestHelpers';

import { requestUserPasswordUpdateV2 } from '../iter3RequestHelpers';
const ERROR = { error: expect.any(String) };
type token = {
  token: string;
}
let user: token;

beforeEach(() => {
  requestClear();
  user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
});

describe('Simple Error Cases for /v2/admin/user/password', () => {
  test('Token is valid structure, but is not for a currently logged in session', () => {
    const updatePassword = requestUserPasswordUpdateV2(user.token + 1, 'z5418123', 'z5418123455');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(403);
  });
  test('Old Password is not the correct old password', () => {
    const updatePassword = requestUserPasswordUpdateV2(user.token, 'z54181234', 'z5418123455');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(400);
  });

  test('New Password has already been used before by this user', () => {
    requestUserPasswordUpdateV2(user.token, 'z5418123', 'z541812345');
    const updatePassword = requestUserPasswordUpdateV2(user.token, 'z541812345', 'z5418123');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(400);
  });

  test('New Password  is less than 8 characters', () => {
    const updatePassword = requestUserPasswordUpdateV2(user.token, 'z5418123', 'z54181');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(400);
  });

  test('New Password does not contain at least one number and at least one letter', () => {
    const updatePassword = requestUserPasswordUpdateV2(user.token, 'z5418123', 'helloiamPhu');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(400);
  });

  test('New Password does not contain at least one number and at least one letter', () => {
    const updatePassword = requestUserPasswordUpdateV2(user.token, 'z5418123', '13241282482');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(400);
  });

  test('Old Password and New Password match exactly', () => {
    const updatePassword = requestUserPasswordUpdateV2(user.token, 'z5418123', 'z5418123');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(400);
  });

  test('token invalid structure', () => {
    const updatePassword = requestUserPasswordUpdateV2(undefined, 'z5418123', 'z541812345');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(401);
  });
});

describe('Sucess Cases for /v1/admin/user/password', () => {
  test('Valid password change ', () => {
    const validPasswordUpdate = requestUserPasswordUpdateV2(user.token, 'z5418123', 'z541812345');
    expect((validPasswordUpdate).retValue).toStrictEqual({});
    expect((validPasswordUpdate).statusCode).toStrictEqual(200);
  });
});

describe('Complex Error Cases for /v1/admin/user/password', () => {
  test('User changes password multiple times therefore has multiple passwords that cannot be used again', () => {
    requestUserPasswordUpdateV2(user.token, 'z5418123', 'z54181234');
    requestUserPasswordUpdateV2(user.token, 'z54181234', 'z541812345');
    requestUserPasswordUpdateV2(user.token, 'z541812345', 'z5418123456');

    const updatePassword = requestUserPasswordUpdateV2(user.token, 'z5418123456', 'z5418123');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(400);

    const updatePassword2 = requestUserPasswordUpdateV2(user.token, 'z5418123456', 'z54181234');
    expect((updatePassword2).retValue).toStrictEqual(ERROR);
    expect((updatePassword2).statusCode).toStrictEqual(400);

    const updatePassword3 = requestUserPasswordUpdateV2(user.token, 'z5418123456', 'z541812345');
    expect((updatePassword3).retValue).toStrictEqual(ERROR);
    expect((updatePassword3).statusCode).toStrictEqual(400);

    const updatePassword4 = requestUserPasswordUpdateV2(user.token, 'z5418123456', 'z5418123456');
    expect((updatePassword4).retValue).toStrictEqual(ERROR);
    expect((updatePassword4).statusCode).toStrictEqual(400);

    const validPasswordUpdate = requestUserPasswordUpdateV2(user.token, 'z5418123456', 'z54181234567');
    expect((validPasswordUpdate).retValue).toStrictEqual({});

    expect((validPasswordUpdate).statusCode).toStrictEqual(200);
  });
});

describe('Logging in with new password /v1/admin/user/password', () => {
  test('User changes password and logins with new password', () => {
    requestUserPasswordUpdateV2(user.token, 'z5418123', 'z54181234');
    requestAuthLogin('phudang@gmail.com', 'z5418123');
    const sucessLogin = requestAuthLogin('phudang@gmail.com', 'z54181234');
    expect((sucessLogin).retValue).toStrictEqual({ token: expect.any(String) });
    expect((sucessLogin).statusCode).toStrictEqual(200);
  });
});

describe('Iteration 2 Tests /v1/admin/user/password', () => {
  test('success,', () => {
    const updatePassword = requestUserPasswordUpdate(user.token, 'z5418123', 'z54181234');
    expect((updatePassword).retValue).toStrictEqual({});
    expect((updatePassword).statusCode).toStrictEqual(200);
  });

  test('Token is valid structure, but is not for a currently logged in session', () => {
    const updatePassword = requestUserPasswordUpdate(user.token + 1, 'z5418123', 'z5418123455');
    expect((updatePassword).retValue).toStrictEqual(ERROR);
    expect((updatePassword).statusCode).toStrictEqual(403);
  });
});
