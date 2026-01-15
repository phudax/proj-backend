import { requestClear, requestAuthRegister, requestQuestionCreate } from '../requestHelpers';
import { requestQuizStartSession, requestAuthLogoutV2, requestQuizCreateV2, requestSessionStatus } from '../iter3RequestHelpers';

const ERROR = { error: expect.any(String) };

type token = {
  token: string;
}

type quiz = {
  quizId: number;
}

type question = {
  questionId: number;
}
let user1: token;
let quiz1: quiz;
let question1: question;

beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
  question1 = requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).retValue;
});

describe('/v1/admin/quiz/{quizid}/session/start, quizStartSession tests', () => {
  describe('Success Cases', () => {
    test('Correct return value', () => {
      const quizSession1 = requestQuizStartSession(quiz1.quizId, user1.token, 5);
      expect(quizSession1.retValue).toStrictEqual({ sessionId: expect.any(Number) });
      expect(quizSession1.statusCode).toStrictEqual(200);
    });

    test('session actually added', () => {
      const quizSession1 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
      const sessionStatus1 = requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token);
      expect(sessionStatus1.statusCode).toStrictEqual(200);
      expect(sessionStatus1.retValue).toStrictEqual(
        {
          state: 'LOBBY',
          atQuestion: 0,
          players: [],
          metadata: {
            quizId: quiz1.quizId,
            name: 'quiz 1',
            timeCreated: expect.any(Number),
            timeLastEdited: expect.any(Number),
            description: 'Fun Quiz',
            numQuestions: 1,
            questions: [
              {
                questionId: question1.questionId,
                question: 'random question',
                duration: 5,
                thumbnailUrl: expect.any(String),
                points: 5,
                answers: [
                  {
                    answerId: expect.any(Number),
                    answer: 'answer1',
                    colour: expect.any(String),
                    correct: true
                  },
                  {
                    answerId: expect.any(Number),
                    answer: 'answer2',
                    colour: expect.any(String),
                    correct: false
                  },
                ]
              }
            ],
            duration: 5,
            thumbnailUrl: expect.any(String)
          }
        }
      );
    });
  });

  describe('Error cases', () => {
    test('Quiz Id does not refer to a valid quiz', () => {
      const quizSession1 = requestQuizStartSession(quiz1.quizId + 1, user1.token, 5);
      expect(quizSession1.retValue).toStrictEqual(ERROR);
      expect(quizSession1.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz that this user owns ', () => {
      const user2 = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      const quiz2 = requestQuizCreateV2(user2.token, 'quiz 2', 'Fun Quiz').retValue;
      requestQuestionCreate(quiz2.quizId, user2.token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
      const quizSession1 = requestQuizStartSession(quiz2.quizId, user1.token, 5);
      expect(quizSession1.retValue).toStrictEqual(ERROR);
      expect(quizSession1.statusCode).toStrictEqual(400);
    });

    test('autoStartNum is a number greater than 50', () => {
      const quizSession1 = requestQuizStartSession(quiz1.quizId, user1.token, 51);
      expect(quizSession1.retValue).toStrictEqual(ERROR);
      expect(quizSession1.statusCode).toStrictEqual(400);
    });

    test('A maximum of 10 sessions that are not in END state currently exist', () => {
      for (let i = 0; i < 10; i++) {
        requestQuizStartSession(quiz1.quizId, user1.token, 5);
      }
      const quizSession1 = requestQuizStartSession(quiz1.quizId, user1.token, 5);
      expect(quizSession1.retValue).toStrictEqual(ERROR);
      expect(quizSession1.statusCode).toStrictEqual(400);
    });

    test('The quiz does not have any questions in it', () => {
      const quiz2 = requestQuizCreateV2(user1.token, 'quiz 2', 'Fun Quiz').retValue;
      const quizSession1 = requestQuizStartSession(quiz2.quizId, user1.token, 5);
      expect(quizSession1.retValue).toStrictEqual(ERROR);
      expect(quizSession1.statusCode).toStrictEqual(400);
    });

    test('token is not for a currently logged in session', () => {
      requestAuthLogoutV2(user1.token);
      const quizSession1 = requestQuizStartSession(quiz1.quizId, user1.token, 5);
      expect(quizSession1.retValue).toStrictEqual(ERROR);
      expect(quizSession1.statusCode).toStrictEqual(403);
    });

    test('token is invalid structure', () => {
      const quizSession1 = requestQuizStartSession(quiz1.quizId, undefined, 5);
      expect(quizSession1.retValue).toStrictEqual(ERROR);
      expect(quizSession1.statusCode).toStrictEqual(401);
    });
  });
});
