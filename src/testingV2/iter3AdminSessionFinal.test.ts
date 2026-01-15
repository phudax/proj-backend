import {
  requestClear,
  requestAuthRegister,
  requestQuestionCreate,
} from '../requestHelpers';
import {
  requestQuizCreateV2,
  requestQuizStartSession,
  requestPlayerJoin,
  requestQuizInfoV2,
  requestSessionFinalResults,
  requestQuizSessionUpdateState,
  requestPlayerAnswerSubmit,
} from '../iter3RequestHelpers';
import { Answer } from '../dataStore';

type token = { token: string; }
type quiz = { quizId: number; }
type session = { sessionId: number; }
type player = { playerId: number; }

let user1: token;
let quiz1: quiz;
let session1: session;
let player1, player2, player3: player;
let Q1A1, Q1A2, Q2A1, Q2A2: number;
let List1, List2: number[];

const ERROR = { error: expect.any(String) };

const answer1 = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
const answer2 = [{ answer: 'npm t', correct: false }, { answer: 'npm lint', correct: true }];
const answerMultipuleCorret = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: true }];

describe('/v1/admin/quiz/{quizid}/session/:sessionid/results, Failure cases', () => {
  beforeEach(async () => {
    requestClear();
    user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 0.5, 5, answer1);
    session1 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
    player1 = requestPlayerJoin(session1.sessionId, 'player1').retValue;
    List1 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    Q1A1 = List1[0];
    Q1A2 = List1[1];
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q1A1], player1.playerId, 1);
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
  });

  test('token Invalid structure', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResults(quiz1.quizId, session1.sessionId, undefined);
    expect(sessionFinalResults1.statusCode).toStrictEqual(401);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('quizId Invalid', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResults(quiz1.quizId + 1, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('Quiz does not belong to this user', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const user2 = requestAuthRegister('z12341234@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    const quiz2 = requestQuizCreateV2(user2.token, 'quiz 1', 'Fun Quiz').retValue;
    const sessionFinalResults1 = requestSessionFinalResults(quiz2.quizId, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('sessionId Invalid', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResults(quiz1.quizId, session1.sessionId + 1, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('token is not of current user', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResults(quiz1.quizId, session1.sessionId, user1.token + 1);
    expect(sessionFinalResults1.statusCode).toStrictEqual(403);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('quizId is not of current user', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResults(quiz1.quizId + 1, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('session is not in FINAL_RESULTS state', () => {
    const sessionFinalResults1 = requestSessionFinalResults(quiz1.quizId, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });
});

describe('/v1/admin/quiz/{quizid}/session/:sessionid/results, Success cases', () => {
  beforeEach(() => {
    requestClear();
  });
  test('2 players, 2 questions, 1 multi answer question', async() => {
    user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 0.5, 5, answerMultipuleCorret);
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 0.5, 5, answer1);
    session1 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
    player1 = requestPlayerJoin(session1.sessionId, 'player1').retValue;
    player2 = requestPlayerJoin(session1.sessionId, 'player2').retValue;
    List1 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    Q1A1 = List1[0];
    Q1A2 = List1[1];
    List2 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[1].answers.map((answer: Answer) => answer.answerId);
    Q2A1 = List2[0];
    Q2A2 = List2[1];
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q1A1, Q1A2], player2.playerId, 1);
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q1A1, Q1A2], player1.playerId, 1);
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q2A1], player2.playerId, 2);
    requestPlayerAnswerSubmit([Q2A2], player1.playerId, 2);
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults = requestSessionFinalResults(quiz1.quizId, session1.sessionId, user1.token);
    expect(sessionFinalResults.statusCode).toStrictEqual(200);
    expect(sessionFinalResults.retValue).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'player2',
          score: 10,
        },
        {
          name: 'player1',
          score: 2.5,
        },
      ],
      questionResults: [
        {
          questionId: expect.any(Number),
          questionCorrectBreakdown: [
            {
              answerId: expect.any(Number),
              playersCorrect: ['player1', 'player2'],
            },
            {
              answerId: expect.any(Number),
              playersCorrect: ['player1', 'player2'],
            },
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100,
        },
        {
          questionId: expect.any(Number),
          questionCorrectBreakdown: [
            {
              answerId: expect.any(Number),
              playersCorrect: ['player2'],
            },
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50,
        },
      ],
    });
  });
  test('3 players, 2 questions', async() => {
    user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
    requestQuestionCreate(quiz1.quizId, user1.token, 'question 1', 1, 10, answer1);
    requestQuestionCreate(quiz1.quizId, user1.token, 'question 2', 1, 10, answer2);
    session1 = requestQuizStartSession(quiz1.quizId, user1.token, 0).retValue;
    player1 = requestPlayerJoin(session1.sessionId, 'player1').retValue;
    player2 = requestPlayerJoin(session1.sessionId, 'player2').retValue;
    player3 = requestPlayerJoin(session1.sessionId, 'player3').retValue;
    List1 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    Q1A1 = List1[0];
    Q1A2 = List1[1];
    List2 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[1].answers.map((answer: Answer) => answer.answerId);
    Q2A1 = List2[0];
    Q2A2 = List2[1];
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise(resolve => setTimeout(resolve, 100));
    requestPlayerAnswerSubmit([Q1A1], player1.playerId, 1);
    requestPlayerAnswerSubmit([Q1A1], player2.playerId, 1);
    requestPlayerAnswerSubmit([Q1A1], player3.playerId, 1);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise(resolve => setTimeout(resolve, 100));
    requestPlayerAnswerSubmit([Q2A2], player1.playerId, 2);
    requestPlayerAnswerSubmit([Q2A2], player2.playerId, 2);
    requestPlayerAnswerSubmit([Q2A1], player3.playerId, 2);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const finalResults = requestSessionFinalResults(quiz1.quizId, session1.sessionId, user1.token);
    expect(finalResults.statusCode).toStrictEqual(200);
    expect(finalResults.retValue).toStrictEqual({
      usersRankedByScore: [
        { name: 'player1', score: 20 },
        { name: 'player2', score: 10 },
        { name: 'player3', score: 3.3 }
      ],
      questionResults: [
        {
          questionId: expect.any(Number),
          questionCorrectBreakdown: [
            {
              answerId: Q1A1,
              playersCorrect: ['player1', 'player2', 'player3']
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100
        },
        {
          questionId: expect.any(Number),
          questionCorrectBreakdown: [
            {
              answerId: Q2A2,
              playersCorrect: ['player1', 'player2']
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 66.7
        }
      ]
    });
  });
});
