import {
  requestAuthRegister,
  requestClear,
  requestQuizListTrash,
} from '../requestHelpers';
import {
  requestQuizCreateV2,
  requestQuizRemoveV2,
  requestQuizTrashV2,
} from '../iter3RequestHelpers';

type token = {
  token: string;
}
  type quizId = {
  quizId: number;
}

let user1: token;
let quiz1: quizId;

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
  quiz1 = requestQuizCreateV2(user1.token, 'President Quiz', 'Quiz about presidents').retValue;
});

describe('Error tests', () => {
  test('AuthUserId is not a valid user', () => {
    const ListQuizTrash = requestQuizTrashV2(user1.token + 1);
    expect(ListQuizTrash.statusCode).toStrictEqual(403);
    expect(ListQuizTrash.retValue).toStrictEqual(ERROR);
  });
});

describe('Error test User returns', () => {
  test('Owner has removed none of there Quizzes', () => {
    const ListQuizTrash1 = requestQuizTrashV2(user1.token);
    expect(ListQuizTrash1.retValue).toStrictEqual({
      quizzes: [
      ]
    });
  });
  test('Owner removes only one quiz', () => {
    requestQuizRemoveV2(user1.token, quiz1.quizId);
    const ListQuizTrash1 = requestQuizTrashV2(user1.token);
    expect(ListQuizTrash1.statusCode).toStrictEqual(200);
    expect(ListQuizTrash1.retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz1.quizId,
          name: 'President Quiz',
        }
      ]
    });
  });
  test('Owner removes multiple quizzes', () => {
    const quiz2 = requestQuizCreateV2(user1.token, 'Cooking', 'Quiz about cooking').retValue;
    requestQuizRemoveV2(user1.token, quiz1.quizId);
    requestQuizRemoveV2(user1.token, quiz2.quizId);
    const ListQuizTrash1 = requestQuizTrashV2(user1.token);
    expect(ListQuizTrash1.statusCode).toStrictEqual(200);
    expect(ListQuizTrash1.retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz1.quizId,
          name: 'President Quiz',
        },
        {
          quizId: quiz2.quizId,
          name: 'Cooking',
        },
      ]
    });
  });
  test('Owner removes one quiz but keeps the other', () => {
    requestQuizCreateV2(user1.token, 'Cooking', 'Quiz about cooking');
    requestQuizRemoveV2(user1.token, quiz1.quizId);
    const ListQuizTrash1 = requestQuizTrashV2(user1.token);
    expect(ListQuizTrash1.statusCode).toStrictEqual(200);
    expect(ListQuizTrash1.retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz1.quizId,
          name: 'President Quiz',
        }
      ]
    });
  });

  test('invalid token structure', () => {
    const ListQuizTrash1 = requestQuizTrashV2(undefined);
    expect(ListQuizTrash1.retValue).toStrictEqual(ERROR);
    expect(ListQuizTrash1.statusCode).toStrictEqual(401);
  });
});

describe('Test Returns with multiple Users', () => {
  test('user1 removes his quizzes and user2 views trash', () => {
    const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
    requestQuizCreateV2(user1.token, 'Cooking', 'Quiz about cooking');
    requestQuizRemoveV2(user1.token, quiz1.quizId);
    const ListQuizTrash1 = requestQuizTrashV2(user1.token);
    const ListQuizTrash2 = requestQuizTrashV2(user2.token);
    expect(ListQuizTrash1.statusCode).toStrictEqual(200);
    expect(ListQuizTrash1.retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz1.quizId,
          name: 'President Quiz',
        }
      ]
    });
    expect(ListQuizTrash2.statusCode).toStrictEqual(200);
    expect(ListQuizTrash2.retValue).toStrictEqual({
      quizzes: [
      ]
    });
  });
  test('Multiple users remove their quiz and view trash', () => {
    const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
    const user3 = requestAuthRegister('z6666000@gmail.com', 'zingerbox121', 'Fire', 'Punch').retValue;
    const quiz2 = requestQuizCreateV2(user2.token, 'KFC', 'Quiz about Kentucky').retValue;
    const quiz3 = requestQuizCreateV2(user3.token, 'Fire', 'Quiz about FireBoy').retValue;
    requestQuizRemoveV2(user1.token, quiz1.quizId);
    requestQuizRemoveV2(user2.token, quiz2.quizId);
    requestQuizRemoveV2(user3.token, quiz3.quizId);
    const ListQuizTrash1 = requestQuizTrashV2(user1.token);
    const ListQuizTrash2 = requestQuizTrashV2(user2.token);
    const ListQuizTrash3 = requestQuizTrashV2(user3.token);
    expect(ListQuizTrash1.statusCode).toStrictEqual(200);
    expect(ListQuizTrash1.retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz1.quizId,
          name: 'President Quiz',
        }
      ]
    });
    expect(ListQuizTrash2.statusCode).toStrictEqual(200);
    expect(ListQuizTrash2.retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz2.quizId,
          name: 'KFC',
        }
      ]
    });
    expect(ListQuizTrash3.statusCode).toStrictEqual(200);
    expect(ListQuizTrash3.retValue).toStrictEqual({
      quizzes: [
        {
          quizId: quiz3.quizId,
          name: 'Fire',
        }
      ]
    });
  });

  test('ITERATION 2 COVERAGE test', () => {
    const ListQuizTrash = requestQuizListTrash(user1.token);
    expect(ListQuizTrash.statusCode).toStrictEqual(200);
  });
});
