import { requestClear, requestAuthRegister, requestQuizCreate, requestQuestionCreate } from '../requestHelpers';
import { requestQuizInfoV2, requestQuestionUpdateV2 } from '../iter3RequestHelpers';

type token = {
  token: string;
}
type quizid = {
  quizId: number;
}

let user1: token;
let quiz1: quizid;
let question: {
    questionId: number;
};

const VALID_THUMBNAIL_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Ruby-LowCompression-Tiny.jpg';
const UPDATED_THUMBNAIL_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/481px-Cat03.jpg';
const INVALID_URL = 'https://upload.wikimedia.org/dasdasffewfbananananawikipedia/commons/2/2b/Ruby-LowCompression-Tiny.jpg';
const INVALID_THUMBNAIL_URL_GIF = 'https://upload.wikimedia.org/wikipedia/commons/a/aa/SmallFullColourGIF.gif';

const LONG_STRING51 = 'a'.repeat(51);
const LONG_STRING31 = 'a'.repeat(31);
const VALID_QUESTION1 = 'Which word means affirmative?';
const VALID_QUESTION2 = 'Which word means negative?';
const UPDATED_QUESTION1 = 'Who is in the Aero group?';
const UPDATED_QUESTION2 = 'Who is not in the Aero group?';

const VALID_ANSWER1 = [{ answer: 'Yes', correct: true }, { answer: 'No', correct: false }];
const VALID_ANSWER2 = [{ answer: 'No', correct: true }, { answer: 'Yes', correct: false }, { answer: 'Maybe', correct: false }];
const UPDATED_ANSWER1 = [{ answer: 'Phu', correct: true }, { answer: 'Gary', correct: false }, { answer: 'Will', correct: true }];
const UPDATED_ANSWER2 = [{ answer: 'Hien', correct: true }, { answer: 'Alex', correct: false }];

const LONG_ANSWER = [{ answer: LONG_STRING31, correct: true }, { answer: 'Bob', correct: false }];
const DUPLICATE_ANSWER = [{ answer: 'Yes', correct: true }, { answer: 'Yes', correct: true }];
const NO_CORRECT_ANSWER = [{ answer: 'Yes', correct: false }, { answer: 'No', correct: false }];
const INSUFFICIENT_ANSWER = [{ answer: 'Yes', correct: true }];

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz1 = requestQuizCreate(user1.token, 'President Quiz', 'Fun Quiz').retValue;
  question = requestQuestionCreate(quiz1.quizId, user1.token, VALID_QUESTION1, 5, 5, VALID_ANSWER1).retValue;
});

describe('Testing question update', () => {
  describe('error testing', () => {
    test('Token is invalid', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, undefined, VALID_QUESTION1, 5, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(401);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('Token is not current user', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token + 1, VALID_QUESTION1, 5, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(403);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('quizId is invalid', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId + 1, question.questionId, user1.token, VALID_QUESTION1, 5, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('quizId is not of current owner', () => {
      const user2 = requestAuthRegister('monkeymonkey@gmail.com', 'monkey1234', 'Jia', 'En').retValue;
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user2.token, VALID_QUESTION1, 5, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('questionId is invalid', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId + 1, user1.token, VALID_QUESTION1, 5, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question length is to long', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, LONG_STRING51, 5, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question answers is less than 2', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 5, INSUFFICIENT_ANSWER, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question duration is negative', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, -1, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question duration is to long', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 181, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('Duration of quiz cannot exceed 3 minutes', () => {
      for (let i = 0; i < 17; i++) {
        requestQuestionCreate(quiz1.quizId, user1.token, VALID_QUESTION1, 10, 5, VALID_ANSWER1);
      }
      const question2 = requestQuestionCreate(quiz1.quizId, user1.token, VALID_QUESTION1, 1, 5, VALID_ANSWER1).retValue;
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question2.questionId, user1.token, VALID_QUESTION1, 10, 5, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question points is to high', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 11, VALID_ANSWER1, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('answer is too long', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 5, LONG_ANSWER, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('answer is duplicate', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 5, DUPLICATE_ANSWER, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('answer has no correct', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 5, NO_CORRECT_ANSWER, VALID_THUMBNAIL_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('thumbnailUrl is an empty string', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 5, VALID_ANSWER1, '');
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('thumbnailUrl does not return a valid file', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 5, VALID_ANSWER1, INVALID_URL);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });
    test('thumbnailUrl is not a jpg or png file type', () => {
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, VALID_QUESTION1, 5, 5, VALID_ANSWER1, INVALID_THUMBNAIL_URL_GIF);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });
  });

  describe('success testing', () => {
    test('update quiz with two questions, check if total quiz duration is changed', () => {
      const Question2 = requestQuestionCreate(quiz1.quizId, user1.token, VALID_QUESTION2, 5, 5, VALID_ANSWER2).retValue;
      const QuestionUpdate = requestQuestionUpdateV2(quiz1.quizId, question.questionId, user1.token, UPDATED_QUESTION1, 6, 6, UPDATED_ANSWER1, UPDATED_THUMBNAIL_URL);
      expect(QuestionUpdate.retValue).toStrictEqual({});
      expect(QuestionUpdate.statusCode).toStrictEqual(200);
      const QuestionUpdate2 = requestQuestionUpdateV2(quiz1.quizId, Question2.questionId, user1.token, UPDATED_QUESTION2, 10, 5, UPDATED_ANSWER2, UPDATED_THUMBNAIL_URL);
      expect(QuestionUpdate2.retValue).toStrictEqual({});
      expect(QuestionUpdate2.statusCode).toStrictEqual(200);
      const QuizInfo = requestQuizInfoV2(user1.token, quiz1.quizId).retValue;
      expect(QuizInfo).toEqual({
        quizId: expect.any(Number),
        name: expect.any(String),
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 2,
        questions: [
          {
            questionId: expect.any(Number),
            question: UPDATED_QUESTION1,
            duration: 6,
            thumbnailUrl: expect.any(String),
            points: 6,
            answers: [
              {
                answerId: expect.any(Number),
                answer: UPDATED_ANSWER1[0].answer,
                colour: expect.any(String),
                correct: UPDATED_ANSWER1[0].correct
              },
              {
                answerId: expect.any(Number),
                answer: UPDATED_ANSWER1[1].answer,
                colour: expect.any(String),
                correct: UPDATED_ANSWER1[1].correct
              },
              {
                answerId: expect.any(Number),
                answer: UPDATED_ANSWER1[2].answer,
                colour: expect.any(String),
                correct: UPDATED_ANSWER1[2].correct
              }
            ]
          },
          {
            questionId: expect.any(Number),
            question: UPDATED_QUESTION2,
            duration: 10,
            thumbnailUrl: expect.any(String),
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: UPDATED_ANSWER2[0].answer,
                colour: expect.any(String),
                correct: UPDATED_ANSWER2[0].correct
              },
              {
                answerId: expect.any(Number),
                answer: UPDATED_ANSWER2[1].answer,
                colour: expect.any(String),
                correct: UPDATED_ANSWER2[1].correct
              }
            ],
          }
        ],
        duration: 16,
        thumbnailUrl: expect.any(String)
      });
    });
  });
});
