import { requestClear, requestAuthRegister, requestQuestionCreate } from '../requestHelpers';

import {
  requestQuizStartSession,
  requestQuizCreateV2,
  requestPlayerJoin,
  requestQuizSessionUpdateState,
  requestPlayerAnswerSubmit,
  requestQuizInfoV2,
  requestSessionResults
} from '../iter3RequestHelpers';
import { COMMANDS, Answer } from '../dataStore';

type token = {
  token: string;
}

type quizId = {
  quizId: number;
}

type questionId = {
  questionId: number;
}

type playerid = {
  playerId: number;
}
type sessionid = {
  sessionId: number;
}

const ERROR = { error: expect.any(String) };
let user: token;
let quiz: quizId;
let question: questionId;
let quizSession: sessionid;
let player: playerid;
let validAnswerId1: number;
let answerIdList: number[];
let quiz1: quizId;

let player1: playerid;
let player2: playerid;
type session = { sessionId: number; }

let user1: token;
let session1: session;

let Q1A1, Q1A2, Q2A1, Q2A2: number;
let List1, List2: number[];
const answers = [
  {
    answer: 'npm t',
    correct: true
  },
  {
    answer: 'npm lint',
    correct: false
  }
];

describe(' Error Cases for Session Results', () => {
  beforeEach(async() => {
    requestClear();
    user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
    quiz = requestQuizCreateV2(user.token, 'Computer Science', 'JavaScript').retValue;
    question = requestQuestionCreate(quiz.quizId, user.token, 'How to run test on terminal?', 3, 3, answers).retValue;
    quizSession = requestQuizStartSession(quiz.quizId, user.token, 5).retValue;
    player = requestPlayerJoin(quizSession.sessionId, 'Phu').retValue;
    answerIdList = requestQuizInfoV2(user.token, quiz.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    validAnswerId1 = answerIdList[0];
    requestQuizSessionUpdateState(quiz.quizId, quizSession.sessionId, user.token, COMMANDS.NEXT_QUESTION);
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([validAnswerId1], player.playerId, 1);
    requestQuizSessionUpdateState(quiz.quizId, quizSession.sessionId, user.token, COMMANDS.GO_TO_ANSWER);

    requestQuizSessionUpdateState(quiz.quizId, quizSession.sessionId, user.token, COMMANDS.GO_TO_FINAL_RESULTS);
  });

  describe(' Error Cases for Session Results', () => {
    test('If playerID does not exist', () => {
      const result = requestSessionResults(player.playerId + 1);
      expect((result).retValue).toStrictEqual(ERROR);
      expect((result).statusCode).toStrictEqual(400);
    });

    test('Session is not in FINAL_RESULTS state', () => {
      requestQuizSessionUpdateState(quiz.quizId, quizSession.sessionId, user.token, COMMANDS.END);
      const result = requestSessionResults(player.playerId);
      expect((result).retValue).toStrictEqual(ERROR);
      expect((result).statusCode).toStrictEqual(400);
    });
  });

  describe(' Sucess Case for Results of Session', () => {
    test('Get Result of a Session', () => {
      const result = requestSessionResults(player.playerId);

      expect((result).retValue).toStrictEqual({
        usersRankedByScore: [
          {
            name: 'Phu',
            score: 3
          }
        ],
        questionResults: [
          {
            questionId: question.questionId,
            questionCorrectBreakdown: [
              {
                answerId: validAnswerId1,
                playersCorrect: [
                  'Phu'
                ]
              }
            ],
            averageAnswerTime: expect.any(Number),
            percentCorrect: 100
          }
        ]
      });
      expect((result).statusCode).toStrictEqual(200);
    });
  });
});

const answer1 = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
const answerMultipuleCorret = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: true }];

describe('/v1/admin/quiz/{quizid}/session/:sessionid/results, Success cases', () => {
  beforeEach(() => {
    requestClear();
  });
  test('2 players, 2 questions, 1 multi answer question', async() => {
    user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
    quiz1 = requestQuizCreateV2(user1.token, 'quiz 1', 'Fun Quiz').retValue;
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 3, 5, answerMultipuleCorret);
    requestQuestionCreate(quiz1.quizId, user1.token, 'random question', 3, 5, answer1);
    session1 = requestQuizStartSession(quiz1.quizId, user1.token, 5).retValue;
    player1 = requestPlayerJoin(session1.sessionId, 'player1').retValue;
    player2 = requestPlayerJoin(session1.sessionId, 'player2').retValue;
    List1 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
    Q1A1 = List1[0];
    Q1A2 = List1[1];
    List2 = requestQuizInfoV2(user1.token, quiz1.quizId).retValue.questions[1].answers.map((answer: Answer) => answer.answerId);
    Q2A1 = List2[0];
    Q2A2 = List2[1];
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, COMMANDS.NEXT_QUESTION);
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q1A1, Q1A2], player2.playerId, 1);
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q1A1, Q1A2], player1.playerId, 1);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, COMMANDS.GO_TO_ANSWER);
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, COMMANDS.NEXT_QUESTION);
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q2A1], player2.playerId, 2);
    await new Promise((r) => setTimeout(r, 100));
    requestPlayerAnswerSubmit([Q2A2], player1.playerId, 2);

    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, COMMANDS.GO_TO_ANSWER);
    requestQuizSessionUpdateState(quiz1.quizId, session1.sessionId, user1.token, COMMANDS.GO_TO_FINAL_RESULTS);
    const result = requestSessionResults(player1.playerId);
    expect(result.statusCode).toStrictEqual(200);
    expect(result.retValue).toStrictEqual({
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
});
