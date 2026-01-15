import { requestClear, requestAuthRegister, requestQuizCreate, requestQuestionCreate } from '../requestHelpers';
import { requestQuizStartSession, requestPlayerJoin, requestQuizSessionSendMessage, requestSessionMessages } from '../iter3RequestHelpers';

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

type player = {
  playerId: number;
}

let user1: token;
let quiz1: quiz;
let quizSession1: session;
let player1: player;

beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz1 = requestQuizCreate(user1.token, 'quiz 1', 'Fun Quiz').retValue;
  requestQuestionCreate(quiz1.quizId, user1.token, 'question1', 1, 1, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
  requestQuestionCreate(quiz1.quizId, user1.token, 'question2', 1, 1, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
  quizSession1 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
  player1 = requestPlayerJoin(quizSession1.sessionId, 'jane citizen').retValue;
});

describe('/v1/admin/quiz/{quizid}/session/{sesionid}, Update a quiz session state tests', () => {
  describe('Success Cases', () => {
    test('return value', () => {
      const message1 = requestQuizSessionSendMessage(player1.playerId, { messageBody: 'hello everyone' });
      expect(message1.retValue).toStrictEqual({});
      expect(message1.statusCode).toStrictEqual(200);
    });

    test('message successfully sent', () => {
      requestQuizSessionSendMessage(player1.playerId, { messageBody: 'hello everyone' });
      const chatMessages1 = requestSessionMessages(player1.playerId);
      expect(chatMessages1.retValue).toStrictEqual({
        messages: [
          {
            messageBody: 'hello everyone',
            playerId: player1.playerId,
            playerName: 'jane citizen',
            timeSent: expect.any(Number),
          },
        ]
      });
      expect(chatMessages1.statusCode).toStrictEqual(200);
    });
  });

  describe('Error cases', () => {
    test('Player ID does not exist', () => {
      const message1 = requestQuizSessionSendMessage(player1.playerId + 1, { messageBody: 'hello everyone' });
      expect(message1.retValue).toStrictEqual(ERROR);
      expect(message1.statusCode).toStrictEqual(400);
    });

    test('message body is less than 1 character', () => {
      const message1 = requestQuizSessionSendMessage(player1.playerId, { messageBody: '' });
      expect(message1.retValue).toStrictEqual(ERROR);
      expect(message1.statusCode).toStrictEqual(400);
    });

    test('message body is more than 100 characters', () => {
      const text = 'a';
      const message1 = requestQuizSessionSendMessage(player1.playerId, { messageBody: text.repeat(101) });
      expect(message1.retValue).toStrictEqual(ERROR);
      expect(message1.statusCode).toStrictEqual(400);
    });
  });
});
