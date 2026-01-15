import {
  requestAuthLogin,
  requestQuizCreate,
  requestAuthRegister,
  requestClear,
  requestQuestionCreate,
} from '../requestHelpers';

import {
  requestQuizSessionUpdateState,
  requestQuizStartSession,
  requestPlayerJoin,
  requestPlayerCurrentQuestion
} from '../iter3RequestHelpers';

const ERROR = { error: expect.any(String) };

const exampleName = 'examplename';
const playerName1 = 'John Doe';
const exampleDescription = 'exampledescrption';
const validQuestion1 = 'Which word means affirmative?';
const validAnswer1 = [
  {
    answer: 'Yes',
    correct: true
  },
  {
    answer: 'No',
    correct: false
  }
];
const validQuestion2 = 'what is 2+2?';
const validAnswer2 = [
  {
    answer: '4',
    correct: true
  },
  {
    answer: '3',
    correct: false
  }
];
const validAnswer3 = [
  {
    answer: '5',
    correct: true
  },
  {
    answer: '6',
    correct: false
  }
];

interface answers {
  answerId: number,
  answer: string,
  colour: string
}

interface statusType {
  questionId: number,
  question: string,
  duration: number,
  thumbnailUrl: string,
  points: number,
  answers: answers[],
}

function typeCheck(obj: statusType) {
  return typeof obj.questionId === 'number' && typeof obj.duration === 'number' && typeof obj.points === 'number' &&
  typeof obj.question === 'string' && typeof obj.thumbnailUrl === 'string';
}

function notEqualCheck (value1: number, value2: number) {
  return value1 === value2;
}

const sessionCreate = () => {
  requestClear();
  requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'Jane', 'Citizen');
  const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue;
  const exampleQuiz = requestQuizCreate(exampleToken.token, exampleName, exampleDescription).retValue;
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion1, 1, 5, validAnswer1);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion2, 1, 5, validAnswer2);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion2, 1, 5, validAnswer3);
  const session = requestQuizStartSession(exampleQuiz.quizId, exampleToken.token, 5).retValue.sessionId;
  return {
    sessionId: session,
    quizId: exampleQuiz.quizId,
    token: exampleToken.token
  };
};

describe('/v1/player/:playerId/question/:questionposition tests', () => {
  describe('error cases', () => {
    test('Invalid Player Id', () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      const response = requestPlayerCurrentQuestion(examplePlayer.playerId - 1, 1);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(400);
    });

    test('question position is invalid', () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      const response = requestPlayerCurrentQuestion(examplePlayer.playerId, 5);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(400);
    });
    test('session is not at current question', () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      const response = requestPlayerCurrentQuestion(examplePlayer.playerId, 2);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(400);
    });
    test('session is in the lobby', () => {
      const { sessionId } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      const response = requestPlayerCurrentQuestion(examplePlayer.playerId, 0);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(400);
    });
    test('session is at the end', () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'END');
      const response = requestPlayerCurrentQuestion(examplePlayer.playerId, 0);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(400);
    });
  });
  describe('success cases', () => {
    test('successful return type', () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      const response = requestPlayerCurrentQuestion(examplePlayer.playerId, 1);
      expect(response.statusCode).toEqual(200);
      expect(typeCheck(response.retValue)).toEqual(true);
    });
    test('successful change between question', async () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      let response = requestPlayerCurrentQuestion(examplePlayer.playerId, 1);
      expect(response.statusCode).toEqual(200);
      const questionId1 = response.retValue.questionId;
      await new Promise((r) => setTimeout(r, 100));
      requestQuizSessionUpdateState(quizId, sessionId, token, 'GO_TO_ANSWER');
      await new Promise((r) => setTimeout(r, 100));
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      response = requestPlayerCurrentQuestion(examplePlayer.playerId, 2);
      expect(response.statusCode).toEqual(200);
      const questionId2 = response.retValue.questionId;
      expect(notEqualCheck(questionId1, questionId2)).toEqual(false);
    });
  });
});
