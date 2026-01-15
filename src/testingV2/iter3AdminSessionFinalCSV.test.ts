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
  requestSessionFinalResultsCSV,
  requestQuizSessionUpdateState,
  requestPlayerAnswerSubmit,
} from '../iter3RequestHelpers';
import { Answer } from '../dataStore';
import axios from 'axios';

type token = { token: string; }
type quiz = { quizId: number; }
type session = { sessionId: number; }
type player = { playerId: number; }

let user1: token;
let quiz1: quiz;
let session1: session;
let player1, player2, player3: player;
let Q1A1, Q2A1, Q2A2, Q3A1, Q3A2: number;
let List1, List2, List3: number[];

const ERROR = { error: expect.any(String) };

const answer1 = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
const answer2 = [{ answer: 'npm t', correct: true }, { answer: 'npm lint', correct: false }];
const answer3 = [{ answer: 'npm', correct: true }, { answer: 'npm non', correct: false }];

describe('/v1/admin/quiz/{quizid}/session/:sessionid/results, Faliure cases', () => {
  beforeEach(async () => {
    requestClear();
    user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 0.5, 5, answer1);
    session1 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
    player1 = requestPlayerJoin(session1.sessionId, 'player1').retValue;
    List1 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    Q1A1 = List1[0];

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 50));
    requestPlayerAnswerSubmit([Q1A1], player1.playerId, 1);
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
  });

  test('token Invalid structure', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz1.quizId, session1.sessionId, undefined);
    expect(sessionFinalResults1.statusCode).toStrictEqual(401);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('quizId Invalid', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz1.quizId + 1, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('sessionId Invalid', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz1.quizId, session1.sessionId + 1, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('token is not of current user', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz1.quizId, session1.sessionId, user1.token + 1);
    expect(sessionFinalResults1.statusCode).toStrictEqual(403);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('quizId is not of current user', () => {
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const user2 = requestAuthRegister('z12341234@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    const quiz2 = requestQuizCreateV2(user2.token, 'quiz 1', 'Fun Quiz').retValue;
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz2.quizId, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });

  test('session is not in FINAL_RESULTS state', () => {
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz1.quizId, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(400);
    expect(sessionFinalResults1.retValue).toStrictEqual(ERROR);
  });
});

describe('/v1/admin/quiz/{quizid}/session/:sessionid/results, Success cases', () => {
  beforeEach(() => {
    requestClear();
  });
  test('3 players, 2 questions', async () => {
    user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 0.5, 10, answer1);
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question  2', 0.5, 5, answer2);
    session1 = requestQuizStartSession(quiz1.quizId, user1.token, 4).retValue;
    player1 = requestPlayerJoin(session1.sessionId, 'WILL').retValue;
    player2 = requestPlayerJoin(session1.sessionId, 'HIEN').retValue;
    player3 = requestPlayerJoin(session1.sessionId, 'BEAN').retValue;
    List1 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    Q1A1 = List1[0];

    List2 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[1].answers.map((answer: Answer) => answer.answerId);
    Q2A1 = List2[0];
    Q2A2 = List2[1];

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q1A1], player1.playerId, 1);
    requestPlayerAnswerSubmit([Q1A1], player2.playerId, 1);
    requestPlayerAnswerSubmit([Q1A1], player3.playerId, 1);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q2A1], player1.playerId, 2);
    requestPlayerAnswerSubmit([Q2A1], player2.playerId, 2);
    requestPlayerAnswerSubmit([Q2A1], player3.playerId, 2);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz1.quizId, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(200);
    const urlCSV = sessionFinalResults1.retValue.url;
    const response = await axios.get(urlCSV, { responseType: 'text' });
    expect(response.status).toStrictEqual(200);
    expect(response.data).toStrictEqual(
      'Player,question1score,question1rank,question2score,question2rank\nBEAN,3.3,3,1.7,3\nHIEN,5,2,2.5,2\nWILL,10,1,5,1'
    );
  });
  test('2 players, 3 questions', async () => {
    user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 1, 5, answer1);
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question  2', 1, 5, answer2);
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question  3', 1, 5, answer3);
    session1 = requestQuizStartSession(quiz1.quizId, user1.token, 3).retValue;
    player1 = requestPlayerJoin(session1.sessionId, 'WILL').retValue;
    player2 = requestPlayerJoin(session1.sessionId, 'HIEN').retValue;
    List1 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    Q1A1 = List1[0];

    List2 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[1].answers.map((answer: Answer) => answer.answerId);
    Q2A1 = List2[0];
    Q2A2 = List2[1];
    List3 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[2].answers.map((answer: Answer) => answer.answerId);
    Q3A1 = List3[0];
    Q3A2 = List3[1];

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q1A1], player1.playerId, 1);
    requestPlayerAnswerSubmit([Q1A1], player2.playerId, 1);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q2A2], player1.playerId, 2);
    requestPlayerAnswerSubmit([Q2A1], player2.playerId, 2);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'NEXT_QUESTION');
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q3A1], player1.playerId, 3);
    requestPlayerAnswerSubmit([Q3A2], player2.playerId, 3);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_ANSWER');
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, 'GO_TO_FINAL_RESULTS');
    const sessionFinalResults1 = requestSessionFinalResultsCSV(quiz1.quizId, session1.sessionId, user1.token);
    expect(sessionFinalResults1.statusCode).toStrictEqual(200);
    const urlCSV = sessionFinalResults1.retValue.url;
    const response = await axios.get(urlCSV, { responseType: 'text' });
    expect(response.status).toStrictEqual(200);
    expect(response.data).toStrictEqual(
      'Player,question1score,question1rank,question2score,question2rank,question3score,question3rank\nHIEN,2.5,2,5,1,0,2\nWILL,5,1,0,2,5,1'
    );
  });
});
