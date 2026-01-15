import { requestAuthRegister, requestQuizCreate, requestQuizInfo, requestClear, requestQuizNameUpdate } from '../requestHelpers';
import { requestQuizNameUpdateV2 } from '../iter3RequestHelpers';

type token = {
  token: string;
}
type quiz = {
  quizId: number;
}
type error = {
  error: string;
}
type requestReturn = {
  retValue: Record<string, never> | error;
  statusCode: number;
}
let user1: token;
let quiz1: quiz;
let update: requestReturn;
const ERROR = { error: expect.any(String) };
beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z999999@gmail.com', 'z8787g8wuhu2', 'Obama', 'Washington').retValue;
  quiz1 = requestQuizCreate(user1.token, 'President Quiz', 'Quiz about past presidents of the USA').retValue;
});

describe('/v2/admin/quiz/{quizid}/name, update quiz name tests', () => {
  describe('Error tests', () => {
    test('token is not of a currently logged in user', () => {
      update = requestQuizNameUpdateV2(user1.token + 1, quiz1.quizId, 'Soccer');
      expect(update.statusCode).toStrictEqual(403);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test('Quiz ID does not refer to a valid quiz', () => {
      update = requestQuizNameUpdateV2(user1.token, quiz1.quizId + 1, 'Soccer');
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      update = requestQuizNameUpdateV2(user2.token, quiz1.quizId, 'Soccer');
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test('Name contains any characters that are not alphanumeric or spaces', () => {
      update = requestQuizNameUpdateV2(user1.token, quiz1.quizId, '@cats :3');
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test('Name is either less than 3 characters long or more than 30 characters long', () => {
      expect(requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'po').statusCode).toStrictEqual(400);
      expect(requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'a'.repeat(31)).statusCode).toStrictEqual(400);
    });

    test('Name is already used by the current logged in user for another quiz', () => {
      requestQuizCreate(user1.token, 'Cooking', 'Quiz about cooking');
      update = requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'Cooking');
      expect(update.statusCode).toStrictEqual(400);
      expect(update.retValue).toStrictEqual(ERROR);
    });

    test('token is not a valid structure', () => {
      const update = requestQuizNameUpdateV2(undefined, quiz1.quizId, 'History of Eugenics');
      expect(update.retValue).toEqual(ERROR);
      expect(update.statusCode).toEqual(401);
    });
  });

  describe('No Error tests - checking return values', () => {
    test('Owner changes name of his only quiz', () => {
      update = requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'History of Eugenics');
      expect(update.retValue).toStrictEqual({});
      expect(update.statusCode).toStrictEqual(200);
    });

    test('Owner changes name of his quiz twice', () => {
      requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'History of Eugenics');
      update = requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'Lobotomy');
      expect(update.retValue).toStrictEqual({});
      expect(update.statusCode).toStrictEqual(200);
    });

    test('Owner changes name of his quiz to the same as another user\'s quiz', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      requestQuizCreate(user2.token, 'Fast Food', 'Prices of items in menu');
      update = requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'Fast Food');
      expect(update.retValue).toStrictEqual({});
      expect(update.statusCode).toStrictEqual(200);
    });

    test('Multiple quizzes and users exist', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      const quiz2 = requestQuizCreate(user2.token, 'Fast Food', 'Prices of items in menu').retValue;
      const quiz3 = requestQuizCreate(user1.token, 'Math', 'addition and subtraction').retValue;
      expect(requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'History of Eugenics').retValue).toStrictEqual({});
      expect(requestQuizNameUpdateV2(user2.token, quiz2.quizId, 'Rocket science').retValue).toStrictEqual({});
      expect(requestQuizNameUpdateV2(user1.token, quiz3.quizId, 'Best stocks').retValue).toStrictEqual({});
    });
  });

  describe('No Error tests - checking quizInfo if name value is correct', () => {
    test('Owner changes name of his only quiz', () => {
      requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'History of Eugenics');
      const quizDetails = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      expect(quizDetails.name).toStrictEqual('History of Eugenics');
    });

    test('Owner changes name of his quiz twice', () => {
      requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'History of Eugenics');
      requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'Lobotomy');
      const quizDetails = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      expect(quizDetails.name).toStrictEqual('Lobotomy');
    });

    test('Owner changes name of his quiz to the same as another user\'s quiz', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      requestQuizCreate(user2.token, 'Fast Food', 'Prices of items in menu');
      requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'Fast Food');
      const quizDetails = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      expect(quizDetails.name).toStrictEqual('Fast Food');
    });

    test('Multiple quizzes and users exist', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      const quiz2 = requestQuizCreate(user2.token, 'Fast Food', 'Prices of items in menu').retValue;
      const quiz3 = requestQuizCreate(user1.token, 'Math', 'addition and subtraction').retValue;
      requestQuizNameUpdateV2(user1.token, quiz1.quizId, 'History of Eugenics');
      requestQuizNameUpdateV2(user2.token, quiz2.quizId, 'Rocket science');
      requestQuizNameUpdateV2(user1.token, quiz3.quizId, 'Best stocks');
      const quizDetails1 = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      const quizDetails2 = requestQuizInfo(user2.token, quiz2.quizId).retValue;
      const quizDetails3 = requestQuizInfo(user1.token, quiz3.quizId).retValue;
      expect(quizDetails1.name).toStrictEqual('History of Eugenics');
      expect(quizDetails2.name).toStrictEqual('Rocket science');
      expect(quizDetails3.name).toStrictEqual('Best stocks');
    });
  });
});
describe('/v1/admin/quiz/{quizid}/name, OLD ITERATION 2 TESTS', () => {
  test('changes name of a quiz once', () => {
    update = requestQuizNameUpdate(user1.token, quiz1.quizId, 'History of Eugenics');
    expect(update.retValue).toStrictEqual({});
    expect(update.statusCode).toStrictEqual(200);
  });
  test('token is not a valid structure', () => {
    const update = requestQuizNameUpdate(undefined, quiz1.quizId, 'History of Eugenics');
    expect(update.retValue).toEqual(ERROR);
    expect(update.statusCode).toEqual(401);
  });
});
