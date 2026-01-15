import { requestClear, requestAuthRegister, requestQuizCreate, requestQuestionCreate } from '../requestHelpers';
import { requestQuizStartSession, requestPlayerJoin, requestQuizSessionUpdateState, requestSessionStatus } from '../iter3RequestHelpers';

type token = {
  token: string;
}
type quizid = {
  quizId: number;
}
type playerid = {
  playerId: number;
}
type sessionid = {
  sessionId: number;
}
type error = {
  error: string;
}
type requestReturn = {
  retValue: playerid | error;
  statusCode: number;
}
const ERROR = { error: expect.any(String) };
let user: token;
let quiz: quizid;
let session: sessionid;
let player: requestReturn;
const VALID_QUESTION = 'Which word means affirmative?';
const VALID_DURATION = 5;
const VALID_POINTS = 5;
const VALID_ANSWER = [
  {
    answer: 'Yes',
    correct: true
  },
  {
    answer: 'No',
    correct: false
  }
];

beforeEach(() => {
  requestClear();
  user = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz = requestQuizCreate(user.token, 'President Quiz', 'Fun Quiz').retValue;
  requestQuestionCreate(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER);
  session = requestQuizStartSession(quiz.quizId, user.token, 5).retValue;
});

describe('/v1/player/join, allow a guest player to join a session', () => {
  describe('Error case tests', () => {
    test('Non unique name', () => {
      requestPlayerJoin(session.sessionId, 'bob');
      player = requestPlayerJoin(session.sessionId, 'bob');
      expect(player.retValue).toStrictEqual(ERROR);
      expect(player.statusCode).toStrictEqual(400);
    });

    test('Session is not in LOBBY state', () => {
      requestQuizSessionUpdateState(quiz.quizId, session.sessionId, user.token, 'END');
      player = requestPlayerJoin(session.sessionId, 'bob');
      expect(player.retValue).toStrictEqual(ERROR);
      expect(player.statusCode).toStrictEqual(400);
    });

    test('Invalid SessionId', () => {
      player = requestPlayerJoin(session.sessionId + 1, 'bob');
      expect(player.retValue).toStrictEqual(ERROR);
      expect(player.statusCode).toStrictEqual(400);
    });
  });
  describe('Success case tests', () => {
    test('Adding a player successfully', () => {
      player = requestPlayerJoin(session.sessionId, 'bob');
      expect(player.retValue).toStrictEqual({ playerId: expect.any(Number) });
      expect(player.statusCode).toStrictEqual(200);
    });

    test('Adding a player successfully with blank name', () => {
      player = requestPlayerJoin(session.sessionId, '');
      expect(player.retValue).toStrictEqual({ playerId: expect.any(Number) });
      expect(player.statusCode).toStrictEqual(200);
      const name = requestSessionStatus(quiz.quizId, session.sessionId, user.token).retValue.players;
      expect(/^[A-Za-z]{5}\d{3}$/.test(name[0])).toStrictEqual(true);
    });
  });
});
