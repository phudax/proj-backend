import {
  requestAuthRegister, requestQuizCreate,
  requestQuizNameUpdate, requestClear, requestQuizRemove, requestQuizList
} from '../requestHelpers';

import { requestQuizListV2 } from '../iter3RequestHelpers';
const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
});

describe('test for errors', () => {
  test('token is not a valid user', () => {
    const user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    expect(requestQuizListV2(user.token + 1).retValue).toStrictEqual(ERROR);
    expect(requestQuizListV2(user.token + 1).statusCode).toStrictEqual(403);
  });

  test('token is not a valid structure', () => {
    const quizInfo1 = requestQuizListV2(undefined);
    expect(quizInfo1.retValue).toStrictEqual(ERROR);
    expect(quizInfo1.statusCode).toStrictEqual(401);
  });
});

describe('Valid token', () => {
  test('Creates List for one quiz', () => {
    const user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    const quiz = requestQuizCreate(user.token, 'Computer Science', 'JavaScript').retValue;

    expect(requestQuizListV2(user.token).retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Computer Science',
        }
      ],
    });
    expect(requestQuizListV2(user.token).statusCode).toStrictEqual(200);
  });

  test('List for Multiple valid quizzes', () => {
    const user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    const quiz = requestQuizCreate(user.token, 'Computer Science', 'JavaScript').retValue;
    const quiz2 = requestQuizCreate(user.token, 'Math', 'Algebra').retValue;
    const quiz3 = requestQuizCreate(user.token, 'Sport', 'Soccer').retValue;

    expect(requestQuizListV2(user.token).retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Computer Science',
        },
        {
          quizId: quiz2.quizId,
          name: 'Math',
        },
        {
          quizId: quiz3.quizId,
          name: 'Sport',
        },
      ],
    });
    expect(requestQuizListV2(user.token).statusCode).toStrictEqual(200);
  });

  test('List for Multiple valid quizzes', () => {
    const user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    const quiz = requestQuizCreate(user.token, 'Computer Science', 'JavaScript').retValue;
    const quiz2 = requestQuizCreate(user.token, 'Math', 'Algebra').retValue;
    const quiz3 = requestQuizCreate(user.token, 'Sport', 'Soccer').retValue;
    requestQuizNameUpdate(user.token, quiz.quizId, 'Gaming');

    expect(requestQuizListV2(user.token).retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Gaming',
        },
        {
          quizId: quiz2.quizId,
          name: 'Math',
        },
        {
          quizId: quiz3.quizId,
          name: 'Sport',
        },
      ],
    });
    expect(requestQuizListV2(user.token).statusCode).toStrictEqual(200);
  });

  test('First quiz gets removed', () => {
    const user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    const quiz = requestQuizCreate(user.token, 'Computer Science', 'JavaScript').retValue;
    const quiz2 = requestQuizCreate(user.token, 'Math', 'Algebra').retValue;
    const quiz3 = requestQuizCreate(user.token, 'Sport', 'Soccer').retValue;
    requestQuizNameUpdate(user.token, quiz.quizId, 'Gaming');
    requestQuizRemove(user.token, quiz.quizId);

    expect(requestQuizListV2(user.token).retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz2.quizId,
          name: 'Math',
        },
        {
          quizId: quiz3.quizId,
          name: 'Sport',
        },
      ],
    });
    expect(requestQuizListV2(user.token).statusCode).toStrictEqual(200);
  });

  test('All quizzes gets removed', () => {
    const user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    const quiz = requestQuizCreate(user.token, 'Computer Science', 'JavaScript').retValue;
    const quiz2 = requestQuizCreate(user.token, 'Math', 'Algebra').retValue;
    const quiz3 = requestQuizCreate(user.token, 'Sport', 'Soccer').retValue;
    requestQuizNameUpdate(user.token, quiz.quizId, 'Gaming');
    requestQuizRemove(user.token, quiz.quizId);
    requestQuizRemove(user.token, quiz2.quizId);
    requestQuizRemove(user.token, quiz3.quizId);

    expect(requestQuizListV2(user.token).retValue).toStrictEqual({
      quizzes: [

      ],
    });
    expect(requestQuizListV2(user.token).statusCode).toStrictEqual(200);
  });
});

describe('Test Coverage for iter2 Request Heelpers', () => {
  test('token is not a valid user', () => {
    const user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    expect(requestQuizList(user.token + 1).retValue).toStrictEqual(ERROR);
    expect(requestQuizList(user.token + 1).statusCode).toStrictEqual(403);
  });
});
