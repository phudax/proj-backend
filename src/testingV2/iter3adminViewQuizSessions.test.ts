import {
  requestAuthLogin,
  requestQuizCreate,
  requestAuthRegister,
  requestClear,
  requestQuestionCreate
} from '../requestHelpers';

import {
  requestQuizStartSession,
  requestQuizSessionUpdateState,
  requestQuizSessions
} from '../iter3RequestHelpers';

const ERROR = { error: expect.any(String) };
const exampleName = 'examplename';
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

interface statusType {
  activeSessions: number[],
  inactiveSessions: number[]
}

function isReturnType(obj:statusType) {
  return typeof obj.activeSessions[0] === 'number' && typeof obj.inactiveSessions[0] === 'number';
}
const sessionsCreate = () => {
  const { quizId, token } = quizCreate();
  const sessionIdActive = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
  const sessionIdEnd = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
  requestQuizSessionUpdateState(quizId, sessionIdEnd, token, 'END');
  return {
    sessionIdActive: sessionIdActive,
    sessionIdEnd: sessionIdEnd,
    quizId: quizId,
    token: token
  };
};
const quizCreate = () => {
  requestClear();
  requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'Jane', 'Citizen');
  const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue;
  const exampleQuiz = requestQuizCreate(exampleToken.token, exampleName, exampleDescription).retValue;
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion1, 5, 5, validAnswer1);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion2, 5, 5, validAnswer2);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
  return {
    quizId: exampleQuiz.quizId,
    token: exampleToken.token
  };
};

describe('/v1/admin/quiz/:quizId/sessions tests', () => {
  describe('error tests', () => {
    test('Invalid Token type', () => {
      const { quizId } = sessionsCreate();
      const response = requestQuizSessions(undefined, quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(401);
    });
    test('Invalid quizId', () => {
      const { quizId, token } = sessionsCreate();
      const response = requestQuizSessions(token, quizId - 1);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(400);
    });
    test('Token is for a non-logged in user', () => {
      const { quizId, token } = sessionsCreate();
      const response = requestQuizSessions(token + 'd', quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(403);
    });
  });
  describe('success tests', () => {
    test('correct return type', () => {
      const { quizId, token } = sessionsCreate();
      const response = requestQuizSessions(token, quizId);
      expect(isReturnType(response.retValue)).toEqual(true);
      expect(response.statusCode).toEqual(200);
    });
    test('correct return values for 2 sessions', () => {
      const { sessionIdActive, sessionIdEnd, quizId, token } = sessionsCreate();
      const response = requestQuizSessions(token, quizId);
      expect(response.retValue.activeSessions[0]).toEqual(sessionIdActive);
      expect(response.retValue.inactiveSessions[0]).toEqual(sessionIdEnd);
      expect(response.statusCode).toEqual(200);
    });
    test('correct sorting for multiple acitve sessions', () => {
      const { sessionIdActive, sessionIdEnd, quizId, token } = sessionsCreate();
      const sessionIdActive2 = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
      const sessionIdActive3 = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
      const sessionsArray = [sessionIdActive, sessionIdActive2, sessionIdActive3].sort((a, b) => a - b);
      const response = requestQuizSessions(token, quizId);
      expect(response.statusCode).toEqual(200);
      expect(response.retValue.activeSessions.length).toEqual(3);
      expect(response.retValue.inactiveSessions.length).toEqual(1);
      expect(response.retValue.activeSessions).toEqual(sessionsArray);
      expect(response.retValue.inactiveSessions[0]).toEqual(sessionIdEnd);
    });
    test('correct sorting for multiple inactive sessions', () => {
      const { sessionIdActive, sessionIdEnd, quizId, token } = sessionsCreate();
      const sessionIdEnd2 = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
      requestQuizSessionUpdateState(quizId, sessionIdEnd2, token, 'END');
      const sessionIdEnd3 = requestQuizStartSession(quizId, token, 5).retValue.sessionId;
      requestQuizSessionUpdateState(quizId, sessionIdEnd3, token, 'END');
      const sessionsArray = [sessionIdEnd, sessionIdEnd2, sessionIdEnd3].sort((a, b) => a - b);
      const response = requestQuizSessions(token, quizId);
      expect(response.statusCode).toEqual(200);
      expect(response.retValue.activeSessions.length).toEqual(1);
      expect(response.retValue.inactiveSessions.length).toEqual(3);
      expect(response.retValue.inactiveSessions).toEqual(sessionsArray);
      expect(response.retValue.activeSessions[0]).toEqual(sessionIdActive);
    });
    test('correct for no quiz sessions', () => {
      const { quizId, token } = quizCreate();
      const response = requestQuizSessions(token, quizId);
      expect(response.statusCode).toEqual(200);
      expect(response.retValue.inactiveSessions.length).toEqual(0);
      expect(response.retValue.activeSessions.length).toEqual(0);
    });
  });
});
