import {
  requestAuthLogin,
  requestQuizCreate,
  requestAuthRegister,
  requestClear,
  requestQuestionCreate
} from '../requestHelpers';

import {
  requestGuestStatus,
  requestQuizSessionUpdateState,
  requestQuizStartSession,
  requestPlayerJoin,
} from '../iter3RequestHelpers';

const ERROR = { error: expect.any(String) };

const exampleName = 'examplename';
const playerName1 = 'John Doe';
const playerName2 = 'Jane Deer';
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
  state: string
  numQuestions: number,
  atQuestion: number
}

function isStatusType(obj:statusType) {
  return typeof obj.state === 'string' && typeof obj.numQuestions === 'number' && typeof obj.atQuestion === 'number';
}

const sessionCreate = () => {
  requestClear();
  requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'Jane', 'Citizen');
  const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue;
  const exampleQuiz = requestQuizCreate(exampleToken.token, exampleName, exampleDescription).retValue;
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion1, 5, 5, validAnswer1);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion2, 5, 5, validAnswer2);
  const session = requestQuizStartSession(exampleQuiz.quizId, exampleToken.token, 5).retValue.sessionId;
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
  return {
    sessionId: session,
    quizId: exampleQuiz.quizId,
    token: exampleToken.token
  };
};

describe('/v1/player/{playerId} get quest status test', () => {
  describe('Success tests', () => {
    test('successfull return type', () => {
      const sessionId = sessionCreate().sessionId;
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      const response = requestGuestStatus(examplePlayer.playerId);
      expect(response.statusCode).toEqual(200);
      expect(isStatusType(response.retValue)).toEqual(true);
    });
    test('successful return values for one player', () => {
      const sessionId = sessionCreate().sessionId;
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      const response = requestGuestStatus(examplePlayer.playerId).retValue;
      expect(response).toEqual({
        state: 'LOBBY',
        numQuestions: 2,
        atQuestion: 0
      });
    });
    test('successful return values for multiple players', () => {
      const sessionId = sessionCreate().sessionId;
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      const examplePlayer2 = requestPlayerJoin(sessionId, playerName2).retValue;
      const response1 = requestGuestStatus(examplePlayer.playerId).retValue;
      expect(response1).toEqual({
        state: 'LOBBY',
        numQuestions: 2,
        atQuestion: 0
      });
      const response2 = requestGuestStatus(examplePlayer2.playerId).retValue;
      expect(response2).toEqual({
        state: 'LOBBY',
        numQuestions: 2,
        atQuestion: 0
      });
    });
    test('successful return values when state is changed', async () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      const examplePlayer2 = requestPlayerJoin(sessionId, playerName2).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      const response1 = requestGuestStatus(examplePlayer.playerId).retValue;
      expect(response1).toEqual({
        state: 'QUESTION_COUNTDOWN',
        numQuestions: 2,
        atQuestion: 1
      });
      await new Promise((r) => setTimeout(r, 100));
      const response2 = requestGuestStatus(examplePlayer2.playerId).retValue;
      expect(response2).toEqual({
        state: 'QUESTION_OPEN',
        numQuestions: 2,
        atQuestion: 1
      });
    });
    test('successful return values for End State', () => {
      const { sessionId, quizId, token } = sessionCreate();
      const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
      const examplePlayer2 = requestPlayerJoin(sessionId, playerName2).retValue;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'END');
      const response1 = requestGuestStatus(examplePlayer.playerId).retValue;
      expect(response1).toEqual({
        state: 'END',
        numQuestions: 2,
        atQuestion: 0
      });
      const response2 = requestGuestStatus(examplePlayer2.playerId).retValue;
      expect(response2).toEqual({
        state: 'END',
        numQuestions: 2,
        atQuestion: 0
      });
    });
  });
  describe('Error tests', () => {
    const { sessionId } = sessionCreate();
    const examplePlayer = requestPlayerJoin(sessionId, playerName1).retValue;
    test.each([
      { playerId: examplePlayer - 1 },
      { playerId: examplePlayer - 3 }
    ])('Invalid Player Id ($playerId', ({ playerId }) => {
      const response = requestGuestStatus(playerId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(400);
    });
  });
});
