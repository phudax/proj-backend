import { requestClear, requestAuthRegister, requestQuizCreate, requestQuestionCreate } from '../requestHelpers';
import { requestQuizStartSession, requestAuthLogoutV2, requestQuizSessionUpdateState, requestSessionStatus } from '../iter3RequestHelpers';
import { setData, getData } from '../dataStore';

const ERROR = { error: expect.any(String) };

type token = {
  token: string;
}

type quiz = {
  quizId: number;
}

type session = {
  sessionId: number;
}

let user1: token;
let quiz1: quiz;
let quizSession1: session;

const QUESTION_DURATION = 0.15;

const customSessionStatus = (state: string, atQuestion: number) => {
  return {
    state: state,
    atQuestion: atQuestion,
    players: <string[]>[],
    metadata: {
      quizId: expect.any(Number),
      name: 'quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Fun Quiz',
      numQuestions: 2,
      questions: [
        {
          questionId: expect.any(Number),
          question: 'question1',
          duration: QUESTION_DURATION,
          thumbnailUrl: expect.any(String),
          points: 1,
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
            }
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'question2',
          duration: QUESTION_DURATION,
          thumbnailUrl: expect.any(String),
          points: 1,
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
            }
          ]
        }
      ],
      duration: 0.3,
      thumbnailUrl: expect.any(String),
    }
  };
};

beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz1 = requestQuizCreate(user1.token, 'quiz 1', 'Fun Quiz').retValue;
  requestQuestionCreate(quiz1.quizId, user1.token, 'question1', QUESTION_DURATION, 1, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
  requestQuestionCreate(quiz1.quizId, user1.token, 'question2', QUESTION_DURATION, 1, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
  quizSession1 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
});

describe('/v1/admin/quiz/{quizid}/session/{sessionid}, Update a quiz session state tests', () => {
  describe('Success Cases', () => {
    describe('correct return type', () => {
      test('END from LOBBY', () => {
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'END');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('END', 0));
      });

      test('NEXT_QUESTION sets state to QUESTION_COUNTDOWN and QUESTION_OPEN after 0.1s and QUESTION_CLOSE after question duration', async () => {
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('QUESTION_COUNTDOWN', 1));
        await new Promise((r) => setTimeout(r, 100));
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('QUESTION_OPEN', 1));
        await new Promise((r) => setTimeout(r, QUESTION_DURATION * 1000));
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('QUESTION_CLOSE', 1));
      });

      test('GO_TO_ANSWER from QUESTION_OPEN', async () => {
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        await new Promise((r) => setTimeout(r, 100));
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_ANSWER');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('ANSWER_SHOW', 1));
      });

      test('GO_TO_ANSWER from QUESTION_CLOSE', async () => {
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        await new Promise((r) => setTimeout(r, 100));
        await new Promise((r) => setTimeout(r, QUESTION_DURATION * 1000));
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_ANSWER');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
      });

      test('GO_TO_FINAL_RESULTS from QUESTION_CLOSE', async () => {
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        await new Promise((r) => setTimeout(r, 100));
        await new Promise((r) => setTimeout(r, QUESTION_DURATION * 1000));
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('FINAL_RESULTS', 0));
      });

      test('GO_TO_FINAL_RESULTS from ANSWER_SHOW', async () => {
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        await new Promise((r) => setTimeout(r, 100));
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_ANSWER');
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
      });

      test('NEXT_QUESTION from QUESTION_CLOSE', async () => {
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        await new Promise((r) => setTimeout(r, 100));
        await new Promise((r) => setTimeout(r, QUESTION_DURATION * 1000));
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('QUESTION_COUNTDOWN', 2));
      });

      test('NEXT_QUESTION from ANSWER_SHOW', async () => {
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        await new Promise((r) => setTimeout(r, 100));
        requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_ANSWER');
        const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
        expect(sessionUpdate1.retValue).toStrictEqual({});
        expect(sessionUpdate1.statusCode).toStrictEqual(200);
        expect(requestSessionStatus(quiz1.quizId, quizSession1.sessionId, user1.token).retValue).toStrictEqual(customSessionStatus('QUESTION_COUNTDOWN', 2));
      });
    });
  });

  describe('Error Cases', () => {
    test('Quiz Id does not refer to a valid quiz', () => {
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId + 1, quizSession1.sessionId, user1.token, 'END');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz that this user owns ', () => {
      const user2 = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      const quiz2 = requestQuizCreate(user2.token, 'quiz 2', 'Fun Quiz').retValue;
      requestQuestionCreate(quiz2.quizId, user2.token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz2.quizId, quizSession1.sessionId, user1.token, 'END');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('Session Id does not refer to a valid quiz Session', () => {
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId + 1, user1.token, 'END');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('Action provided is not a valid action enum', () => {
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'ENDEE');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('disallowed action enum when state is LOBBY', () => {
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('disallowed action enum when state is QUESTION_COUNTDOWN', () => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('disallowed action enum when state is QUESTION_OPEN', async () => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      await new Promise((r) => setTimeout(r, 100));
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('disallowed action enum when state is ANSWER_SHOW', async () => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      await new Promise((r) => setTimeout(r, 100));
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_ANSWER');
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_ANSWER');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('disallowed action enum when state is FINAL_RESULTS', async () => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      await new Promise((r) => setTimeout(r, 100));
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_ANSWER');
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test.each([
      { action: 'NEXT_QUESTION' },
      { action: 'END' },
    ])('disallowed action enum when state is END', ({ action }) => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'END');
      const sessionUpdate1 = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, action);
      expect(sessionUpdate1.retValue).toStrictEqual(ERROR);
      expect(sessionUpdate1.statusCode).toStrictEqual(400);
    });

    test('token is not a valid structure status code tests', () => {
      const requestObj = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, undefined, 'END');
      expect(requestObj.retValue).toEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(401);
    });

    test('token is valid structure but is not for a currently logged in session', () => {
      requestAuthLogoutV2(user1.token);
      const requestObj = requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'END');
      expect(requestObj.retValue).toStrictEqual(ERROR);
      expect(requestObj.statusCode).toStrictEqual(403);
    });

    test('quizSession cleared before timeout finished', async () => {
      const quizSession2 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
      requestQuizSessionUpdateState(quiz1.quizId, quizSession2.sessionId, user1.token, 'NEXT_QUESTION');
      const data = getData();
      data.quizSessions = [];
      setData(data);
      requestQuizStartSession(quiz1.quizId, user1.token, 5);
      await new Promise((r) => setTimeout(r, 100));
    });

    test('quizSession action enum cannot be applied in current state FIRST CHECK', async() => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'END');
      await new Promise((r) => setTimeout(r, 100));
    });

    test('quizSession cleared before timeout finished SECOND CHECK', async () => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      await new Promise((r) => setTimeout(r, 105));
      requestClear();
    });

    test('quizSession action enum cannot be applied in current state SECOND CHECK', async () => {
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'NEXT_QUESTION');
      await new Promise((r) => setTimeout(r, 105));
      requestQuizSessionUpdateState(quiz1.quizId, quizSession1.sessionId, user1.token, 'END');
    });
  });
});
