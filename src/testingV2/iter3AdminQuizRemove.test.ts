import {
  requestClear, requestAuthLogin, requestAuthRegister, requestQuizList, requestQuizRemove, requestQuestionCreate
} from '../requestHelpers';
import {
  requestQuizRemoveV2, requestQuizSessionUpdateState, requestQuizStartSession, requestAuthLogoutV2, requestQuizCreateV2, requestQuizTrashV2
} from '../iter3RequestHelpers';

const ERROR = { error: expect.any(String) };

const exampleName = 'examplename';
const exampleDescription = 'exampledescrption';
const OK = 200;
const INPUT_ERROR = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

let token: string;
let quizId: number;
beforeEach(() => {
  requestClear();
  requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
  token = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
  quizId = requestQuizCreateV2(token, exampleName, exampleDescription).retValue.quizId;
});

describe('/v2/admin/quiz/:quizId tests', () => {
  describe('Success Cases', () => {
    test('Successful return type', () => {
      const quizRemove1 = requestQuizRemoveV2(token, quizId);
      expect(quizRemove1.retValue).toStrictEqual({});
      expect(quizRemove1.statusCode).toStrictEqual(OK);
    });
    test('checking for removal from list', () => {
      const quizRemove1 = requestQuizRemoveV2(token, quizId);
      expect(quizRemove1.retValue).toStrictEqual({});
      expect(quizRemove1.statusCode).toStrictEqual(OK);
      expect(requestQuizList(token).retValue).toEqual({ quizzes: [] });
      expect(requestQuizTrashV2(token).retValue.quizzes.length).toEqual(1);
    });
    test('checking for removal from list when previously used', () => {
      requestQuestionCreate(quizId, token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
      const sessionId = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'END');
      const response = requestQuizRemoveV2(token, quizId);
      expect(response.retValue).toEqual({});
      expect(response.statusCode).toEqual(OK);
      expect(requestQuizList(token).retValue).toEqual({ quizzes: [] });
      expect(requestQuizTrashV2(token).retValue.quizzes.length).toEqual(1);
    });
  });

  describe('Error Cases', () => {
    test('invalid Token Type', () => {
      const quizRemove1 = requestQuizRemoveV2(undefined, quizId);
      expect(quizRemove1.retValue).toStrictEqual(ERROR);
      expect(quizRemove1.statusCode).toStrictEqual(UNAUTHORIZED);
    });

    test('invalid Quiz Id', () => {
      const quizRemove1 = requestQuizRemoveV2(token, quizId - 1);
      expect(quizRemove1.retValue).toStrictEqual(ERROR);
      expect(quizRemove1.statusCode).toStrictEqual(INPUT_ERROR);
    });

    test('Non Logged in User', () => {
      requestAuthLogoutV2(token);
      const response = requestQuizRemoveV2(token, quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(FORBIDDEN);
    });

    test('invalid owner for Quiz', () => {
      const token2 = requestAuthRegister('jane.citizen1@gmail.com', 'abcd1234', 'william', 'heather').retValue.token;
      const quizRemove1 = requestQuizRemoveV2(token2, quizId);
      expect(quizRemove1.retValue).toStrictEqual(ERROR);
      expect(quizRemove1.statusCode).toStrictEqual(INPUT_ERROR);
    });

    test('removing from a null list', () => {
      const quizRemove1 = requestQuizRemoveV2(token, Math.random());
      expect(quizRemove1.retValue).toStrictEqual(ERROR);
      expect(quizRemove1.statusCode).toStrictEqual(INPUT_ERROR);
    });

    test('removing a quiz already in the trash', () => {
      requestQuizRemoveV2(token, quizId);
      const quizRemove1 = requestQuizRemoveV2(token, quizId);
      expect(quizRemove1.retValue).toStrictEqual(ERROR);
      expect(quizRemove1.statusCode).toStrictEqual(INPUT_ERROR);
    });
    test('removing for a quiz when in session', () => {
      requestQuestionCreate(quizId, token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
      const sessionId = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      const response = requestQuizRemoveV2(token, quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
  });
});

describe('/v1/admin/quiz/:quizId tests', () => {
  describe('success cases', () => {
    test('Successful return type', () => {
      const quizRemove1 = requestQuizRemove(token, quizId);
      expect(quizRemove1.retValue).toStrictEqual({});
      expect(quizRemove1.statusCode).toStrictEqual(200);
    });
  });
  describe('error cases', () => {
    test('invalid User Id', () => {
      const quizRemove1 = requestQuizRemove(token + 'a', quizId);
      expect(quizRemove1.retValue).toStrictEqual(ERROR);
      expect(quizRemove1.statusCode).toStrictEqual(403);
    });
    test('invalid Quiz Id', () => {
      const quizRemove1 = requestQuizRemove(token, quizId - 1);
      expect(quizRemove1.retValue).toStrictEqual(ERROR);
      expect(quizRemove1.statusCode).toStrictEqual(400);
    });
  });
});
