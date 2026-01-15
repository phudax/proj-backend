import { requestClear, requestAuthRegister, requestQuizCreate, requestQuestionCreate } from '../requestHelpers';
import { requestQuizStartSession, requestQuizInfoV2, requestPlayerJoin, requestQuizSessionUpdateState, requestPlayerAnswerSubmit, requestQuestionResults } from '../iter3RequestHelpers';
import { Answer } from '../dataStore';

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
  retValue: Record<string, never> | error;
  statusCode: number;
}
const ERROR = { error: expect.any(String) };
let user: token;
let quiz: quizid;
let session: sessionid;
let player: playerid;
let submit: requestReturn;
let validAnswerId1: number;
let validAnswerId2: number;
let answerIdList: number[];
const VALID_QUESTION = 'Which word means affirmative?';
const VALID_DURATION = 1;
const VALID_POINTS = 5;
const VALID_ANSWER = [
  {
    answer: 'Yes',
    correct: true
  },
  {
    answer: 'No',
    correct: true
  }
];

beforeEach(async () => {
  requestClear();
  user = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz = requestQuizCreate(user.token, 'President Quiz', 'Fun Quiz').retValue;
  requestQuestionCreate(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER);
  requestQuestionCreate(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER);
  session = requestQuizStartSession(quiz.quizId, user.token, 5).retValue;
  player = requestPlayerJoin(session.sessionId, 'bob').retValue;
  answerIdList = requestQuizInfoV2(user.token, quiz.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
  validAnswerId1 = answerIdList[0];
  validAnswerId2 = answerIdList[1];
  requestQuizSessionUpdateState(quiz.quizId, session.sessionId, user.token, 'NEXT_QUESTION');
  await new Promise((r) => setTimeout(r, 100));
});

describe('/v1/player/{playerid}/question/{questionposition}/answer, player submit answer tests', () => {
  describe('Error case tests', () => {
    test('Player Id does not exist', () => {
      submit = requestPlayerAnswerSubmit([validAnswerId1], player.playerId + 1, 1);
      expect(submit.retValue).toStrictEqual(ERROR);
      expect(submit.statusCode).toStrictEqual(400);
    });

    test('Question Position is not valid for the session this player is in', () => {
      submit = requestPlayerAnswerSubmit([validAnswerId1], player.playerId, 4);
      expect(submit.retValue).toStrictEqual(ERROR);
      expect(submit.statusCode).toStrictEqual(400);
    });

    test('Session is not in QUESTION_OPEN state', () => {
      requestQuizSessionUpdateState(quiz.quizId, session.sessionId, user.token, 'GO_TO_ANSWER');
      submit = requestPlayerAnswerSubmit([validAnswerId1], player.playerId, 1);
      expect(submit.retValue).toStrictEqual(ERROR);
      expect(submit.statusCode).toStrictEqual(400);
    });

    test('Session is not up to this question', () => {
      const validAnswerId = requestQuizInfoV2(user.token, quiz.quizId).retValue.questions[1].answers[0].answerId;
      submit = requestPlayerAnswerSubmit([validAnswerId], player.playerId, 2);
      expect(submit.retValue).toStrictEqual(ERROR);
      expect(submit.statusCode).toStrictEqual(400);
    });

    test('Answer Ids are not valid for this particular question', () => {
      submit = requestPlayerAnswerSubmit([validAnswerId1 + validAnswerId2], player.playerId, 1);
      expect(submit.retValue).toStrictEqual(ERROR);
      expect(submit.statusCode).toStrictEqual(400);
    });

    test('There are duplicate answer Ids provided', () => {
      submit = requestPlayerAnswerSubmit([validAnswerId1, validAnswerId1], player.playerId, 1);
      expect(submit.retValue).toStrictEqual(ERROR);
      expect(submit.statusCode).toStrictEqual(400);
    });

    test('Less than 1 answer Id was submitted', () => {
      submit = requestPlayerAnswerSubmit([], player.playerId, 1);
      expect(submit.retValue).toStrictEqual(ERROR);
      expect(submit.statusCode).toStrictEqual(400);
    });
  });
  describe('Success case tests', () => {
    test('Normal success case where player submits single answer', () => {
      submit = requestPlayerAnswerSubmit([validAnswerId1], player.playerId, 1);
      expect(submit.retValue).toStrictEqual({});
      expect(submit.statusCode).toStrictEqual(200);
      requestQuizSessionUpdateState(quiz.quizId, session.sessionId, user.token, 'GO_TO_ANSWER');
      const result = requestQuestionResults(player.playerId, 1).retValue;
      expect(result.questionCorrectBreakdown[0].playersCorrect[0]).toStrictEqual('bob');
    });

    test('Normal success case where player submits multiple answer', () => {
      submit = requestPlayerAnswerSubmit([validAnswerId1, validAnswerId2], player.playerId, 1);
      expect(submit.retValue).toStrictEqual({});
      expect(submit.statusCode).toStrictEqual(200);
      requestQuizSessionUpdateState(quiz.quizId, session.sessionId, user.token, 'GO_TO_ANSWER');
      const result = requestQuestionResults(player.playerId, 1).retValue;
      expect(result.questionCorrectBreakdown[0].playersCorrect[0]).toStrictEqual('bob');
      expect(result.questionCorrectBreakdown[1].playersCorrect[0]).toStrictEqual('bob');
    });
  });
});
