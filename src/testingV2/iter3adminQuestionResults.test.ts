import { requestClear, requestAuthRegister, requestQuestionCreate } from '../requestHelpers';

import {
  requestQuizStartSession,
  requestPlayerJoin,
  requestQuizSessionUpdateState,
  requestQuestionResults,
  requestPlayerAnswerSubmit,
  requestQuizInfoV2,
  requestQuizCreateV2
} from '../iter3RequestHelpers';
import { Answer } from '../dataStore';

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

const answers2 = [
  {
    answer: 'npm t',
    correct: false
  },
  {
    answer: 'npm lint',
    correct: true
  }
];
beforeEach(async() => {
  requestClear();
  user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
  quiz = requestQuizCreateV2(user.token, 'Computer Science', 'JavaScript').retValue;
  question = requestQuestionCreate(quiz.quizId, user.token, 'How to run test on terminal?', 3, 3, answers).retValue;
  requestQuestionCreate(quiz.quizId, user.token, 'How to run lint on terminal?', 3, 3, answers2);
  quizSession = requestQuizStartSession(quiz.quizId, user.token, 5).retValue;
  player = requestPlayerJoin(quizSession.sessionId, 'Phu').retValue;
  answerIdList = requestQuizInfoV2(user.token, quiz.quizId).retValue.questions[0].answers.map((answer: Answer) => answer.answerId);
  validAnswerId1 = answerIdList[0];
  requestQuizSessionUpdateState(quiz.quizId, quizSession.sessionId, user.token, 'NEXT_QUESTION');
  await new Promise((r) => setTimeout(r, 100));
  requestPlayerAnswerSubmit([validAnswerId1], player.playerId, 1);
  requestQuizSessionUpdateState(quiz.quizId, quizSession.sessionId, user.token, 'GO_TO_ANSWER');
});

describe(' Error Cases for Results of Question', () => {
  test('If playerID does not exist', () => {
    const result = requestQuestionResults(player.playerId + 1, 1);
    expect((result).retValue).toStrictEqual(ERROR);
    expect((result).statusCode).toStrictEqual(400);
  });

  test('If question position is not valid for the session this player is in', () => {
    const result = requestQuestionResults(player.playerId, 5);
    expect((result).retValue).toStrictEqual(ERROR);
    expect((result).statusCode).toStrictEqual(400);
  });

  test('Session is not in ANSWER_SHOW state', () => {
    requestQuizSessionUpdateState(quiz.quizId, quizSession.sessionId, user.token, 'END');
    const result = requestQuestionResults(player.playerId, 1);
    expect((result).retValue).toStrictEqual(ERROR);
    expect((result).statusCode).toStrictEqual(400);
  });

  test('if session is not yet up to this question', () => {
    const result = requestQuestionResults(player.playerId, 2);
    expect((result).retValue).toStrictEqual(ERROR);
    expect((result).statusCode).toStrictEqual(400);
  });
});

describe(' Sucess Case for Results of question', () => {
  test('Get Result of question', () => {
    const result = requestQuestionResults(player.playerId, 1);

    expect((result).retValue).toStrictEqual({
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
    });
    expect((result).statusCode).toStrictEqual(200);
  });
});
