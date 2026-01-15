import { requestAuthRegister, requestQuizCreate, requestQuizInfo, requestQuizRemove, requestQuestionCreate, requestClear } from '../requestHelpers';

type token = {
  token: string;
}
type quiz = {
  quizId: number;
}
let user1: token;
let quiz1: quiz;

const ERROR = { error: expect.any(String) };
beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z999999@gmail.com', 'z8787g8wuhu2', 'Obama', 'Washington').retValue;
  quiz1 = requestQuizCreate(user1.token, 'President Quiz', 'Quiz about past presidents of the USA').retValue;
});

describe('/v1/admin/quiz/{quizid} get quiz info test', () => {
  describe('Error case tests', () => {
    test('token is not valid user', () => {
      const info = requestQuizInfo(user1.token + 1, quiz1.quizId);
      expect(info.statusCode).toStrictEqual(403);
      expect(info.retValue).toStrictEqual(ERROR);
    });

    test('Quiz ID does not refer to a valid quiz', () => {
      const info = requestQuizInfo(user1.token, quiz1.quizId + 1);
      expect(info.statusCode).toStrictEqual(400);
      expect(info.retValue).toStrictEqual(ERROR);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      const info = requestQuizInfo(user2.token, quiz1.quizId);
      expect(info.statusCode).toStrictEqual(400);
      expect(info.retValue).toStrictEqual(ERROR);
    });

    test('Owner of quiz accessing after quiz is removed', () => {
      requestQuizRemove(user1.token, quiz1.quizId);
      const info = requestQuizInfo(user1.token, quiz1.quizId);
      expect(info.statusCode).toStrictEqual(400);
      expect(info.retValue).toStrictEqual(ERROR);
    });

    test('Owner of a quiz accesses someone elses quiz', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      const quiz2 = requestQuizCreate(user2.token, 'Fast Food', 'Prices of items in menu').retValue;
      const quiz3 = requestQuizCreate(user1.token, 'Math', 'addition and subtraction').retValue;
      expect(requestQuizInfo(user1.token, quiz2.quizId).statusCode).toStrictEqual(400);
      expect(requestQuizInfo(user2.token, quiz3.quizId).statusCode).toStrictEqual(400);
      expect(requestQuizInfo(user2.token, quiz1.quizId).statusCode).toStrictEqual(400);
    });
  });

  describe('Success tests', () => {
    test('Owner checks quiz', () => {
      const info = requestQuizInfo(user1.token, quiz1.quizId);
      expect(info.statusCode).toStrictEqual(200);
      expect(info.retValue).toStrictEqual({
        quizId: expect.any(Number),
        name: 'President Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz about past presidents of the USA',
        numQuestions: 0,
        questions: [],
        duration: expect.any(Number)
      });
    });
    test('Multiple users and quizzes exist', () => {
      const user2 = requestAuthRegister('z0000000@gmail.com', 'zingerbox121', 'Ronald', 'Ronaldson').retValue;
      const quiz2 = requestQuizCreate(user2.token, 'Fast Food', 'Prices of items in menu').retValue;
      const quiz3 = requestQuizCreate(user1.token, 'Math', 'addition and subtraction').retValue;
      expect(requestQuizInfo(user1.token, quiz1.quizId).retValue).toStrictEqual({
        quizId: expect.any(Number),
        name: 'President Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz about past presidents of the USA',
        numQuestions: 0,
        questions: [],
        duration: expect.any(Number)
      });
      expect(requestQuizInfo(user2.token, quiz2.quizId).retValue).toStrictEqual({
        quizId: expect.any(Number),
        name: 'Fast Food',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Prices of items in menu',
        numQuestions: 0,
        questions: [],
        duration: expect.any(Number)
      });
      expect(requestQuizInfo(user1.token, quiz3.quizId).retValue).toStrictEqual({
        quizId: expect.any(Number),
        name: 'Math',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'addition and subtraction',
        numQuestions: 0,
        questions: [],
        duration: expect.any(Number)
      });
    });
    test('Owner checks quiz that has questions', () => {
      const answers = [
        {
          answer: 'Yes',
          correct: true
        },
        {
          answer: 'No',
          correct: false
        }
      ];
      requestQuestionCreate(quiz1.quizId, user1.token, 'Do you like cats?', 5, 5, answers);
      const info = requestQuizInfo(user1.token, quiz1.quizId);
      expect(info.statusCode).toStrictEqual(200);
      expect(info.retValue).toStrictEqual({
        quizId: expect.any(Number),
        name: 'President Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz about past presidents of the USA',
        numQuestions: 1,
        questions: [
          {
            questionId: expect.any(Number),
            question: 'Do you like cats?',
            duration: 5,
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'Yes',
                colour: expect.any(String),
                correct: true
              },
              {
                answerId: expect.any(Number),
                answer: 'No',
                colour: expect.any(String),
                correct: false
              }
            ]
          }
        ],
        duration: 5
      });
    });
  });
});
