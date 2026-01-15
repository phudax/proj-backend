import {
  requestClear,
  requestAuthRegister,
  requestQuizCreate,
  requestQuestionCreate,
  requestQuizInfo,
  requestQuestionDelete
} from '../requestHelpers';

import {
  requestQuestionDuplicateV2, requestQuestionDeleteV2, requestQuizStartSession, requestQuizSessionUpdateState
} from '../iter3RequestHelpers';

import { COMMANDS } from '../dataStore';
const ERROR = { error: expect.any(String) };

  type token = {
    token: string;
  }

  type quizId = {
    quizId: number;
  }

  type questionId = {
    questionId: number;
  }
let user: token;
let quiz: quizId;
let question: questionId;

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

beforeEach(() => {
  requestClear();
  user = requestAuthRegister('phudang@gmail.com', 'z5418123', 'Phu', 'Dang').retValue;
  quiz = requestQuizCreate(user.token, 'Computer Science', 'JavaScript').retValue;
  question = requestQuestionCreate(quiz.quizId, user.token, 'How to run test on terminal?', 3, 3, answers).retValue;
});

describe(' Error Cases for /v1/admin/quiz/{quizid}/question/{questionid}, Delete quiz question', () => {
  test('Token is valid structure, but is not for a currently logged in session', () => {
    const deleteQuestion = requestQuestionDeleteV2(quiz.quizId, question.questionId, user.token + 1);
    expect((deleteQuestion).retValue).toStrictEqual(ERROR);
    expect((deleteQuestion).statusCode).toStrictEqual(403);
  });

  test('Quiz ID does not refer to a valid quiz', () => {
    const deleteQuestion = requestQuestionDeleteV2(quiz.quizId + 1, question.questionId, user.token);
    expect((deleteQuestion).retValue).toStrictEqual(ERROR);
    expect((deleteQuestion).statusCode).toStrictEqual(400);
  });

  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = requestAuthRegister('Ndang2@gmail.com', 'z5418123123', 'Nathan', 'Dang').retValue;
    const quiz2 = requestQuizCreate(user2.token, 'Sports', 'Soccer').retValue;
    const deleteQuestion = requestQuestionDeleteV2(quiz2.quizId, question.questionId, user.token);
    expect((deleteQuestion).retValue).toStrictEqual(ERROR);
    expect((deleteQuestion).statusCode).toStrictEqual(400);
  });

  test('Question Id does not refer to a valid question within this quiz', () => {
    const deleteQuestion = requestQuestionDeleteV2(quiz.quizId, question.questionId + 1, user.token);
    expect((deleteQuestion).retValue).toStrictEqual(ERROR);
    expect((deleteQuestion).statusCode).toStrictEqual(400);
  });

  test('Removing Question not in end state', () => {
    const sessionId = requestQuizStartSession(quiz.quizId, user.token, 1).retValue.sessionId;
    requestQuizSessionUpdateState(quiz.quizId, sessionId, user.token, COMMANDS.NEXT_QUESTION);
    const deleteQuestion = requestQuestionDeleteV2(quiz.quizId, question.questionId, user.token);
    expect((deleteQuestion).retValue).toStrictEqual(ERROR);
    expect((deleteQuestion).statusCode).toStrictEqual(400);
  });

  test('token invalid structure', () => {
    const deleteQuestion = requestQuestionDeleteV2(quiz.quizId, question.questionId, undefined);
    expect((deleteQuestion).retValue).toStrictEqual(ERROR);
    expect((deleteQuestion).statusCode).toStrictEqual(401);
  });
});

describe(' Sucess Case for /v1/admin/quiz/{quizid}/question/{questionid}, Delete quiz question', () => {
  test('Sucessfully deleting a question', () => {
    const deleteQuestion = requestQuestionDeleteV2(quiz.quizId, question.questionId, user.token);
    expect((deleteQuestion).retValue).toStrictEqual({});
    expect((deleteQuestion).statusCode).toStrictEqual(200);
  });

  test('Sucessfully deleting a question and showing data on QuizInfo', () => {
    requestQuestionDeleteV2(quiz.quizId, question.questionId, user.token);
    const quizInfo = requestQuizInfo(user.token, quiz.quizId).retValue;
    expect(quizInfo.questions).toStrictEqual([

    ]);
  });

  test('Sucessfully deleting a question after duplicating that question and showing data on quizInfo', () => {
    const question2 = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user.token).retValue;
    requestQuestionDeleteV2(quiz.quizId, question2.newQuestionId, user.token);
    const quizInfo = requestQuizInfo(user.token, quiz.quizId).retValue;
    expect(quizInfo).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Computer Science',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'JavaScript',
      numQuestions: 1,
      duration: 3,
      questions:
          [
            {
              questionId: question.questionId,
              question: 'How to run test on terminal?',
              duration: 3,
              points: 3,
              answers: [
                {
                  answerId: expect.any(Number),
                  answer: 'npm t',
                  colour: expect.any(String),
                  correct: true
                },
                {
                  answerId: expect.any(Number),
                  answer: 'npm lint',
                  colour: expect.any(String),
                  correct: false
                }
              ]
            }
          ]
    });
  });

  test('Sucessfully deleting a question reducing the number of questions', () => {
    requestQuestionDeleteV2(quiz.quizId, question.questionId, user.token);
    const quizInfo = requestQuizInfo(user.token, quiz.quizId).retValue;
    expect(quizInfo.numQuestions).toStrictEqual(0);
  });
});

describe(' Error Cases for /v1/admin/quiz/{quizid}/question/{questionid}, Delete quiz question', () => {
  test('Success', () => {
    const deleteQuestion = requestQuestionDelete(quiz.quizId, question.questionId, user.token);
    expect((deleteQuestion).retValue).toStrictEqual({});
    expect((deleteQuestion).statusCode).toStrictEqual(200);
  });
});
