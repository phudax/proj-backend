import {
  requestAuthLogin,
  requestAuthRegister,
  requestClear,
  requestQuestionCreate,
} from '../requestHelpers';

import {
  requestQuizSessionUpdateState,
  requestQuizStartSession,
  requestPlayerJoin,
  requestSessionStatus, requestQuizCreateV2
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

const sessionCreate = () => {
  requestClear();
  requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'Jane', 'Citizen');
  const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue;
  const exampleQuiz = requestQuizCreateV2(exampleToken.token, exampleName, exampleDescription).retValue;
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion1, 5, 5, validAnswer1);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion2, 5, 5, validAnswer2);
  const session = requestQuizStartSession(exampleQuiz.quizId, exampleToken.token, 5).retValue.sessionId;
  return {
    sessionId: session,
    quizId: exampleQuiz.quizId,
    token: exampleToken.token
  };
};

describe('/v1/admin/quiz/:quizId/session/:sessionId', () => {
  describe('success cases', () => {
    test('correct return type', () => {
      const { sessionId, quizId, token } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      const response = requestSessionStatus(quizId, sessionId, token);
      expect(response.statusCode).toEqual(200);
    });
    test('correct return values', () => {
      const { sessionId, quizId, token } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      const response = requestSessionStatus(quizId, sessionId, token);
      expect(response.retValue.metadata.quizId).toEqual(quizId);
      expect(response.retValue.state).toEqual('LOBBY');
      expect(response.retValue.atQuestion).toEqual(0);
      expect(response.retValue.players[0]).toEqual(playerName1);
      expect(response.statusCode).toEqual(200);
    });
    test('correct return type when status changed', () => {
      const { sessionId, quizId, token } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      let response = requestSessionStatus(quizId, sessionId, token);
      expect(response.retValue.state).toEqual('LOBBY');
      expect(response.statusCode).toEqual(200);
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      response = requestSessionStatus(quizId, sessionId, token);
      expect(response.retValue.state).toEqual('QUESTION_COUNTDOWN');
      expect(response.statusCode).toEqual(200);
    });
  });
  describe('error cases', () => {
    test('Invalid quizId', () => {
      const { sessionId, quizId, token } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      const response = requestSessionStatus(quizId - 1, sessionId, token);
      expect(response.statusCode).toEqual(400);
      expect(response.retValue).toEqual(ERROR);
    });
    test('Owner does not own current quiz', () => {
      const { sessionId, quizId } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      requestAuthRegister('john.doe@gmail.com', 'abcd1234', 'john', 'doe');
      const token2 = requestAuthLogin('john.doe@gmail.com', 'abcd1234').retValue.token;
      const response = requestSessionStatus(quizId, sessionId, token2);
      expect(response.statusCode).toEqual(400);
      expect(response.retValue).toEqual(ERROR);
    });
    test('Invalid Session Id', () => {
      const { sessionId, quizId, token } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      const response = requestSessionStatus(quizId, sessionId - 1, token);
      expect(response.statusCode).toEqual(400);
      expect(response.retValue).toEqual(ERROR);
    });
    test('Invalid Token structure', () => {
      const { sessionId, quizId } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      const response = requestSessionStatus(quizId, sessionId, undefined);
      expect(response.statusCode).toEqual(401);
      expect(response.retValue).toEqual(ERROR);
    });
    test('Provided token is valid structure, but is not for a currently logged in session', () => {
      const { sessionId, quizId, token } = sessionCreate();
      requestPlayerJoin(sessionId, playerName1);
      const response = requestSessionStatus(quizId, sessionId, token + 'a');
      expect(response.statusCode).toEqual(403);
      expect(response.retValue).toEqual(ERROR);
    });
  });
});
