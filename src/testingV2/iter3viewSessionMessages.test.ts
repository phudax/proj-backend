import {
  requestAuthLogin,
  requestQuizCreate,
  requestAuthRegister,
  requestClear,
  requestQuestionCreate
} from '../requestHelpers';

import {
  requestPlayerJoin,
  requestQuizSessionSendMessage,
  requestSessionMessages,
  requestQuizStartSession,
  requestQuizSessionUpdateState
} from '../iter3RequestHelpers';

const OK = 200;
const INPUT_ERROR = 400;

const ERROR = { error: expect.any(String) };
const exampleName = 'examplename';
const exampleDescription = 'exampledescrption';
const exampleMessage = { messageBody: 'Hello World' };
const exampleMessage2 = { messageBody: 'Hello Worldb' };
const exampleMessage3 = { messageBody: 'Hello Worldc' };
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
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number
}

function isStatusType(obj:statusType) {
  return typeof obj.messageBody === 'string' && typeof obj.playerId === 'number' && typeof obj.timeSent === 'number' &&
  typeof obj.timeSent === 'number';
}

const sessionCreate = () => {
  requestClear();
  requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'Jane', 'Citizen');
  const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue;
  const exampleQuiz = requestQuizCreate(exampleToken.token, exampleName, exampleDescription).retValue;
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion1, 5, 5, validAnswer1);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, validQuestion2, 5, 5, validAnswer2);
  requestQuestionCreate(exampleQuiz.quizId, exampleToken.token, 'random question', 5, 5, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
  const sessionId = requestQuizStartSession(exampleQuiz.quizId, exampleToken.token, 5).retValue.sessionId;
  return {
    sessionId: sessionId,
    quizId: exampleQuiz.quizId,
    token: exampleToken.token
  };
};

function timeStampCheck(time1:number, time2:number) {
  const difference = Math.abs(time1 - time2);
  return difference <= 1000;
}

describe('/v2/admin/quiz/:playerId/chat tests', () => {
  describe('success cases', () => {
    test('No currrent messages', () => {
      const sessionId = sessionCreate().sessionId;
      const playerId = requestPlayerJoin(sessionId, 'Will Heather').retValue.playerId;
      const response = requestSessionMessages(playerId);
      expect(response.retValue.messages).toEqual([]);
      expect(response.statusCode).toEqual(OK);
    });
    test('view single message', () => {
      const sessionId = sessionCreate().sessionId;
      const playerId = requestPlayerJoin(sessionId, 'Will Heather').retValue.playerId;
      requestQuizSessionSendMessage(playerId, exampleMessage);
      const response = requestSessionMessages(playerId);
      expect(response.retValue.messages.length).toEqual(1);
      expect(response.retValue.messages[0].messageBody).toEqual(exampleMessage.messageBody);
      expect(response.retValue.messages[0].playerId).toEqual(playerId);
      expect(response.statusCode).toEqual(OK);
    });
    test('correct return type', () => {
      const sessionId = sessionCreate().sessionId;
      const playerId = requestPlayerJoin(sessionId, 'Will Heather').retValue.playerId;
      requestQuizSessionSendMessage(playerId, exampleMessage);
      const response = requestSessionMessages(playerId);
      expect(isStatusType(response.retValue.messages[0])).toEqual(true);
      expect(response.statusCode).toEqual(200);
    });
    test('viewing multiple messages from multiple players', () => {
      const sessionId = sessionCreate().sessionId;
      const playerId = requestPlayerJoin(sessionId, 'Will Heather').retValue.playerId;
      requestQuizSessionSendMessage(playerId, exampleMessage);
      const playerId2 = requestPlayerJoin(sessionId, 'Jane Doe').retValue.playerId;
      requestQuizSessionSendMessage(playerId, exampleMessage2);
      requestQuizSessionSendMessage(playerId2, exampleMessage3);
      const response = requestSessionMessages(playerId);
      expect(response.retValue.messages.length).toEqual(3);
      expect(response.retValue.messages[2].messageBody).toEqual(exampleMessage3.messageBody);
      expect(response.statusCode).toEqual(OK);
    });
    test('testing time for submissin', () => {
      const { sessionId, quizId, token } = sessionCreate();
      const playerId = requestPlayerJoin(sessionId, 'Will Heather').retValue.playerId;
      requestQuizSessionUpdateState(quizId, sessionId, token, 'NEXT_QUESTION');
      const timeStamp = Math.floor(Date.now() / 1000);
      requestQuizSessionSendMessage(playerId, exampleMessage);
      const response = requestSessionMessages(playerId);
      expect(timeStampCheck(timeStamp, response.retValue.messages[0].timeSent)).toBe(true);
    });
  });
  describe('Error Cases', () => {
    test('Invalid Player Id', () => {
      const sessionId = sessionCreate().sessionId;
      const playerId = requestPlayerJoin(sessionId, 'Will Heather').retValue.playerId;
      requestQuizSessionSendMessage(playerId, exampleMessage);
      const response = requestSessionMessages(playerId + 1);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
  });
});
