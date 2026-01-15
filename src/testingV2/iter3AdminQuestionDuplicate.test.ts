import { requestClear, requestAuthRegister, requestQuizCreate, requestQuestionDuplicate, requestQuestionCreate } from '../requestHelpers';
import { requestQuizInfoV2, requestQuestionDuplicateV2 } from '../iter3RequestHelpers';

type token = {
  token: string;
}
type quizid = {
  quizId: number;
}
type questionid = {
  questionId: number;
}
type error = {
  error: string;
}
type newquestionid = {
  newQuestionId: number;
}
type requestReturn = {
  retValue: newquestionid | error;
  statusCode: number;
}
let user: token;
let quiz: quizid;
let question: questionid;
let duplicate: requestReturn;
const ERROR = { error: expect.any(String) };
const VALID_QUESTION = 'Which word means affirmative?';
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
  question = requestQuestionCreate(quiz.quizId, user.token, VALID_QUESTION, 5, 5, VALID_ANSWER).retValue;
});

describe('/v2/admin/quiz/{quizid}/question/{questionid}/duplicate, duplicate question test', () => {
  describe('error tests', () => {
    test('Token is of invalid structure', () => {
      duplicate = requestQuestionDuplicateV2(quiz.quizId, question.questionId, undefined);
      expect(duplicate.statusCode).toStrictEqual(401);
      expect(duplicate.retValue).toStrictEqual(ERROR);
    });
    test('Token is not for a currently logged in session', () => {
      duplicate = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user.token + 1);
      expect(duplicate.statusCode).toStrictEqual(403);
      expect(duplicate.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to a valid quiz', () => {
      duplicate = requestQuestionDuplicateV2(quiz.quizId + 1, question.questionId, user.token);
      expect(duplicate.statusCode).toStrictEqual(400);
      expect(duplicate.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to quiz this user owns', () => {
      const user2 = requestAuthRegister('apple@gmail.com', 'abcd1234', 'Samuel', 'White').retValue;
      duplicate = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user2.token);
      expect(duplicate.statusCode).toStrictEqual(400);
      expect(duplicate.retValue).toStrictEqual(ERROR);
    });

    test('Question Id does not refer to a valid question within this quiz', () => {
      duplicate = requestQuestionDuplicateV2(quiz.quizId, question.questionId + 1, user.token);
      expect(duplicate.statusCode).toStrictEqual(400);
      expect(duplicate.retValue).toStrictEqual(ERROR);
    });

    test('Based on assumption - question cannot be duplicated if total quiz duration goes over 3 minutes', () => {
      const question2 = requestQuestionCreate(quiz.quizId, user.token, VALID_QUESTION, 95, 5, VALID_ANSWER).retValue;
      duplicate = requestQuestionDuplicateV2(quiz.quizId, question2.questionId, user.token);
      expect(duplicate.statusCode).toStrictEqual(400);
      expect(duplicate.retValue).toStrictEqual(ERROR);
    });
  });

  describe('Success cases - checking return value', () => {
    test('User duplicates questions twice', () => {
      duplicate = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user.token);
      expect(duplicate.statusCode).toStrictEqual(200);
      expect(duplicate.retValue).toStrictEqual(
        {
          newQuestionId: expect.any(Number)
        }
      );
      duplicate = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user.token);
      expect(duplicate.statusCode).toStrictEqual(200);
      expect(duplicate.retValue).toStrictEqual(
        {
          newQuestionId: expect.any(Number)
        }
      );
    });
  });

  describe('Success cases - checking quizInfo for questions', () => {
    test('User duplicates questions thrice', () => {
      const question2 = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user.token).retValue;
      const question3 = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user.token).retValue;
      const question4 = requestQuestionDuplicateV2(quiz.quizId, question.questionId, user.token).retValue;
      const quizDetails = requestQuizInfoV2(user.token, quiz.quizId).retValue;
      expect(quizDetails.questions).toStrictEqual([
        {
          questionId: question.questionId,
          question: VALID_QUESTION,
          duration: 5,
          thumbnailUrl: expect.any(String),
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Yes',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: question4.newQuestionId,
          question: VALID_QUESTION,
          duration: 5,
          thumbnailUrl: expect.any(String),
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Yes',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: question3.newQuestionId,
          question: VALID_QUESTION,
          duration: 5,
          thumbnailUrl: expect.any(String),
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Yes',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: question2.newQuestionId,
          question: VALID_QUESTION,
          duration: 5,
          thumbnailUrl: expect.any(String),
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Yes',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'No',
              colour: expect.any(String),
              correct: false
            }
          ]
        }
      ]);
    });
  });
});

describe('/v1/admin/quiz/{quizid}/question/{questionid}/duplicate, ITERATION 2 TESTS', () => {
  test('success', () => {
    duplicate = requestQuestionDuplicate(quiz.quizId, question.questionId, user.token);
    expect(duplicate.statusCode).toStrictEqual(200);
    expect(duplicate.retValue).toStrictEqual({
      newQuestionId: expect.any(Number),
    });
  });

  test('Quiz Id does not refer to a valid quiz', () => {
    duplicate = requestQuestionDuplicate(quiz.quizId + 1, question.questionId, user.token);
    expect(duplicate.statusCode).toStrictEqual(400);
    expect(duplicate.retValue).toStrictEqual(ERROR);
  });
});
