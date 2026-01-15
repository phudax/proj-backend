import { requestClear, requestAuthRegister, requestAuthLogin, requestQuizList, requestQuizCreate } from '../requestHelpers';
import { requestQuizCreateV2, requestQuizRemoveV2 } from '../iter3RequestHelpers';

const OK = 200;
const INPUT_ERROR = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const ERROR = { error: expect.any(String) };
const name31Characters = 'q'.repeat(32);
const nameWithNonAscii = 'hello!!';
const description101Characters = 'q'.repeat(105);
const exampleName = 'examplename';
const exampleDescription = 'exampledescrption';
const InvalidToken = 'invalidToken';

beforeEach(() => {
  requestClear();
});

describe('/v2/admin/quiz tests', () => {
  describe('Success Cases', () => {
    test('Sucessful Return Type', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
      const quizId = requestQuizCreateV2(exampleToken, exampleName, exampleDescription);
      expect(quizId.retValue).toEqual({ quizId: expect.any(Number) });
      expect(quizId.statusCode).toEqual(OK);
    });
    test('Successful Addition of Quiz', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
      const quizId = requestQuizCreateV2(exampleToken, exampleName, exampleDescription);
      const quizList = requestQuizList(exampleToken).retValue;
      expect(quizList).toEqual({
        quizzes: [
          {
            quizId: quizId.retValue.quizId,
            name: exampleName,
          }
        ]
      });
    });
  });
  describe('Error Cases', () => {
    test('Invalid User Id', () => {
      const quizId = requestQuizCreateV2(InvalidToken, exampleName + 'a', exampleDescription);
      expect(quizId.retValue).toStrictEqual(ERROR);
      expect(quizId.statusCode).toStrictEqual(FORBIDDEN);
    });
    test('Invalid Name Length', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
      const quizId = requestQuizCreateV2(exampleToken, name31Characters, exampleDescription);
      expect(quizId.retValue).toEqual(ERROR);
      expect(quizId.statusCode).toEqual(INPUT_ERROR);
    });
    test('Non-Ascii Name', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
      const quizId = requestQuizCreateV2(exampleToken, nameWithNonAscii, exampleDescription);
      expect(quizId.retValue).toEqual(ERROR);
      expect(quizId.statusCode).toEqual(INPUT_ERROR);
    });
    test('Invalid Description', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
      const quizId = requestQuizCreateV2(exampleToken, exampleName + 'a', description101Characters);
      expect(quizId.retValue).toEqual(ERROR);
      expect(quizId.statusCode).toEqual(INPUT_ERROR);
    });
    test('Repeat Name in quizzes', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
      requestQuizCreateV2(exampleToken, exampleName + 'c', exampleDescription);
      const quizId = requestQuizCreateV2(exampleToken, exampleName + 'c', exampleDescription);
      expect(quizId.retValue).toEqual(ERROR);
      expect(quizId.statusCode).toEqual(INPUT_ERROR);
    });

    test('Repeat Name in trash', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
      const quizId2 = requestQuizCreateV2(exampleToken, exampleName + 'c', exampleDescription).retValue;
      requestQuizRemoveV2(exampleToken, quizId2.quizId);
      const quizId = requestQuizCreateV2(exampleToken, exampleName + 'c', exampleDescription);
      expect(quizId.retValue).toEqual(ERROR);
      expect(quizId.statusCode).toEqual(INPUT_ERROR);
    });
    test.each([
      { token: undefined },
    ])('token is not a valid structure', ({ token }) => {
      const quizCreate1 = requestQuizCreateV2(token, exampleName, exampleDescription);
      expect(quizCreate1.retValue).toEqual(ERROR);
      expect(quizCreate1.statusCode).toEqual(UNAUTHORIZED);
    });
  });
});

describe('/v2/admin/quiz tests', () => {
  describe('Success Cases', () => {
    test('Successful quiz creation', () => {
      requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
      const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue;
      const quizCreate1 = requestQuizCreate(exampleToken.token, exampleName, exampleDescription);
      expect(quizCreate1.retValue).toStrictEqual({ quizId: expect.any(Number) });
      expect(quizCreate1.statusCode).toStrictEqual(200);
    });
  });
  describe('Error Cases', () => {
    test.each([
      { token: undefined },
      { token: null },
      { token: 15 },
    ])('token is not a valid structure', ({ token }) => {
      const quizCreate1 = requestQuizCreate(token as any, exampleName, exampleDescription);
      expect(quizCreate1.retValue).toEqual(ERROR);
      expect(quizCreate1.statusCode).toEqual(401);
    });
  });
});
