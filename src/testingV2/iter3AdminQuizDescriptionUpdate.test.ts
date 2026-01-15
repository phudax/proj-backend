import { requestAuthRegister, requestQuizInfo, requestClear, requestQuizDescriptionUpdate } from '../requestHelpers';
import { requestQuizDescriptionUpdateV2, requestQuizCreateV2 } from '../iter3RequestHelpers';

type token = {
  token: string;
};
type quiz = {
  quizId: number;
};

const ERROR = { error: expect.any(String) };
let user1: token;
let quiz1: quiz;

beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z888888@gmail.com', 'z8888g8wuhu2', 'Hienz', 'Beanz').retValue;
  quiz1 = requestQuizCreateV2(user1.token, 'Bean Quiz', 'Quiz about beans').retValue;
});

describe('/v2/admin/quiz/{quizid)/description', () => {
  describe('Error Tests', () => {
    test('token is not of a currently logged in user', () => {
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user1.token + 1, quiz1.quizId, 'Soccer');
      expect(descriptionUpdate1.retValue).toStrictEqual(ERROR);
      expect(descriptionUpdate1.statusCode).toStrictEqual(403);
    });

    test('Quiz ID does not refer to a valid quiz', () => {
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId + 1, 'Soccer');
      expect(descriptionUpdate1.retValue).toStrictEqual(ERROR);
      expect(descriptionUpdate1.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user2.token, quiz1.quizId, 'Soccer');
      expect(descriptionUpdate1.retValue).toStrictEqual(ERROR);
      expect(descriptionUpdate1.statusCode).toStrictEqual(400);
    });

    test('Description is more than 100 characters in length', () => {
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'a'.repeat(101));
      expect(descriptionUpdate1.retValue).toStrictEqual(ERROR);
      expect(descriptionUpdate1.statusCode).toStrictEqual(400);
    });

    test('token is not a valid structure', () => {
      const update = requestQuizDescriptionUpdateV2(undefined, quiz1.quizId, 'a'.repeat(90));
      expect(update.retValue).toEqual(ERROR);
      expect(update.statusCode).toEqual(401);
    });
  });

  describe('Checking return on Success', () => {
    test('Name contains any characters that are not alphanumeric or spaces', () => {
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, '@cats :3');
      expect(descriptionUpdate1.retValue).toStrictEqual({});
      expect(descriptionUpdate1.statusCode).toEqual(200);
    });

    test('Owner changes description of his only quiz', () => {
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Its not really about beans');
      expect(descriptionUpdate1.retValue).toStrictEqual({});
      expect(descriptionUpdate1.statusCode).toEqual(200);
    });

    test('Owner changes description of his quiz twice', () => {
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Quiz on Monkeys');
      expect(descriptionUpdate1.retValue).toStrictEqual({});
      expect(descriptionUpdate1.statusCode).toEqual(200);
    });

    test('Owner changes description to the same as another quiz Description', () => {
      const user2 = requestAuthRegister('z6666666@gmail.com', 'Swinging2017', 'Jia', 'Monkey').retValue;
      requestQuizCreateV2(user2.token, 'Monkey Quiz', 'Quiz about monkeys');
      const descriptionUpdate1 = requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Quiz about monkeys');
      expect(descriptionUpdate1.retValue).toStrictEqual({});
      expect(descriptionUpdate1.statusCode).toEqual(200);
    });
  });

  describe('Checking if Quiz Description is correct value', () => {
    test('Owner changes description of his only quiz', () => {
      requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Quiz about monkeys');
      const quizDetails = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      expect(quizDetails.description).toStrictEqual('Quiz about monkeys');
    });

    test('Owner changes description of his quiz twice', () => {
      requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Quiz about monkeys');
      requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Stop monkeying around');
      const quizDetails = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      expect(quizDetails.description).toStrictEqual('Stop monkeying around');
    });

    test('Owner changes description to the same as another quiz Description', () => {
      const user2 = requestAuthRegister('z6666666@gmail.com', 'Swinging2017', 'Jia', 'Monkey').retValue;
      requestQuizCreateV2(user2.token, 'Monkey Quiz', 'Quiz about monkeys');
      requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Quiz about monkeys');
      const quizDetails = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      expect(quizDetails.description).toStrictEqual('Quiz about monkeys');
    });

    test('Multiple quizzes and users exist', () => {
      const user2 = requestAuthRegister('z6666666@gmail.com', 'Swinging4444', 'Jia', 'Monkey').retValue;
      const quiz2 = requestQuizCreateV2(user2.token, 'Monkey Quiz', 'monkeys').retValue;
      const quiz3 = requestQuizCreateV2(user1.token, 'New Quiz', 'swinging').retValue;
      requestQuizDescriptionUpdateV2(user1.token, quiz1.quizId, 'Quiz about Hienz Beanz');
      requestQuizDescriptionUpdateV2(user2.token, quiz2.quizId, 'Quiz about monkeys');
      requestQuizDescriptionUpdateV2(user1.token, quiz3.quizId, 'Quiz about CXO');
      const quizDetails1 = requestQuizInfo(user1.token, quiz1.quizId).retValue;
      const quizDetails2 = requestQuizInfo(user2.token, quiz2.quizId).retValue;
      const quizDetails3 = requestQuizInfo(user1.token, quiz3.quizId).retValue;
      expect(quizDetails1.description).toStrictEqual('Quiz about Hienz Beanz');
      expect(quizDetails2.description).toStrictEqual('Quiz about monkeys');
      expect(quizDetails3.description).toStrictEqual('Quiz about CXO');
    });
  });
});

describe('/v1/admin/quiz/{quizid)/description ITERATION 2 COVERAGE test', () => {
  test('Quiz ID does not refer to a valid quiz', () => {
    const descriptionUpdate1 = requestQuizDescriptionUpdate(user1.token, quiz1.quizId, 'Soccer');
    expect(descriptionUpdate1.retValue).toStrictEqual({});
    expect(descriptionUpdate1.statusCode).toStrictEqual(200);
  });
});
