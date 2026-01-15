import { requestClear, requestAuthRegister, requestQuizRestore } from '../requestHelpers';
import { requestQuizRestoreV2, requestAuthLogoutV2, requestQuizTrashV2, requestQuizCreateV2, requestQuizRemoveV2 } from '../iter3RequestHelpers';
const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
});

type token = {
  token: string;
}

type quiz = {
  quizId: number;
}

describe('/v2/admin/quiz/{quizid}/restore tests', () => {
  describe('Success Cases', () => {
    let user1: token;
    let quiz1: quiz;
    beforeEach(() => {
      user1 = requestAuthRegister('jane.citizen@getMaxListeners.com', 'abcd1234', 'jane', 'citizen').retValue;
      quiz1 = requestQuizCreateV2(user1.token, 'COMPquiz', 'compquizdescription').retValue;
    });

    test('basic return type test', () => {
      requestQuizRemoveV2(user1.token, quiz1.quizId);
      const requestObj = requestQuizRestoreV2(quiz1.quizId, user1.token);
      expect(requestObj.retValue).toStrictEqual({});
      expect(requestObj.statusCode).toStrictEqual(200);
    });

    test('successfully restore quiz from trash', () => {
      requestQuizRemoveV2(user1.token, quiz1.quizId);
      requestQuizRestoreV2(quiz1.quizId, user1.token);
      expect(requestQuizTrashV2(user1.token).retValue).toStrictEqual({ quizzes: [] });
    });
  });

  describe('Error; Cases', () => {
    let user1: token;
    let user2: token;
    let quiz1: quiz;
    beforeEach(() => {
      user1 = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      user2 = requestAuthRegister('jane.citizen2@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      quiz1 = requestQuizCreateV2(user1.token, 'COMP quiz', 'comp quiz description').retValue;
    });

    test('Quiz ID does not refer to a valid quiz', () => {
      requestQuizRemoveV2(user1.token, quiz1.quizId);
      const requestObj = requestQuizRestoreV2(quiz1.quizId + 1, user1.token);
      expect(requestObj.retValue).toStrictEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      requestQuizRemoveV2(user1.token, quiz1.quizId);
      const quiz2 = requestQuizCreateV2(user2.token, 'mathquiz', 'mathquizdescription').retValue;
      const requestObj = requestQuizRestoreV2(quiz2.quizId, user1.token);
      requestQuizRemoveV2(user2.token, quiz2.quizId);
      expect(requestObj.retValue).toStrictEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      requestQuizRemoveV2(user1.token, quiz1.quizId);
      const quiz2 = requestQuizCreateV2(user2.token, 'math quiz', 'math quiz description').retValue;
      requestQuizRemoveV2(user2.token, quiz2.quizId);
      const requestObj = requestQuizRestoreV2(quiz2.quizId, user1.token);
      expect(requestObj.retValue).toStrictEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(400);
    });

    test('Quiz ID refers to a quiz that is not currently in the trash', () => {
      const requestObj = requestQuizRestoreV2(quiz1.quizId, user1.token);
      expect(requestObj.retValue).toStrictEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(400);
    });

    test.each([
      { token: undefined },
    ])('token is not a valid structure status code tests', ({ token }) => {
      const requestObj = requestQuizRestoreV2(quiz1.quizId, token as any);
      expect(requestObj.retValue).toEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(401);
    });

    test('token is valid structure but is not for a currently logged in session', () => {
      requestAuthLogoutV2(user1.token);
      const requestObj = requestQuizRestoreV2(quiz1.quizId, user1.token);
      expect(requestObj.retValue).toStrictEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(403);
    });
  });
});

describe('/v1/admin/quiz/{quizid}/restore tests ITERATION 2 COVERAGE', () => {
  test('basic return type test', () => {
    const user1 = requestAuthRegister('jane.citizen@getMaxListeners.com', 'abcd1234', 'jane', 'citizen').retValue;
    const quiz1 = requestQuizCreateV2(user1.token, 'COMP quiz', 'comp quiz description').retValue;
    requestQuizRemoveV2(user1.token, quiz1.quizId);
    const requestObj = requestQuizRestore(quiz1.quizId, user1.token);
    expect(requestObj.retValue).toStrictEqual({});
    expect(requestObj.statusCode).toStrictEqual(200);
  });
});
