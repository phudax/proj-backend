import { requestAuthRegister, requestClear, requestUserDetails } from '../requestHelpers';

const ERROR = { error: expect.any(String) };

describe('/clear tests', () => {
  describe('Success Cases', () => {
    test('returns empty object', () => {
      const clear1 = requestClear();
      expect(clear1.retValue).toStrictEqual({});
      expect(clear1.statusCode).toStrictEqual(200);
    });
    test('clears user in dataStore', () => {
      const user1 = requestAuthRegister('z888888@gmail.com', 'z8888g8wuhu2', 'Hienz', 'Beanz').retValue;
      requestClear();
      expect(requestUserDetails(user1.token).retValue).toStrictEqual(ERROR);
    });
  });
});
