import { requestClear, requestAuthRegister, requestQuizCreate } from '../requestHelpers';
import { requestQuestionCreateV2, requestQuizInfoV2 } from '../iter3RequestHelpers';
type token = {
  token: string;
}
type quizid = {
  quizId: number;
}

const ERROR = { error: expect.any(String) };
let user: token;
let quiz: quizid;
const VALID_THUMBNAIL_URL = 'https://i.etsystatic.com/26144034/r/il/4b2747/2893024997/il_570xN.2893024997_hxfx.jpg';
const INVALID_URL = 'https://www.adorama.com/alc/wp-content/uploads/2021/05/bird-wings-flying.gif';
const INVALID_THUMBNAIL_URL_GIF = 'https://upload.wikimedia.org/wikipedia/commons/a/aa/SmallFullColourGIF.gif';
const LONG_STRING = 'a'.repeat(51);
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
const INSUFFICIENT_ANSWER = [
  {
    answer: 'Yes',
    correct: true
  }
];
const LONG_ANSWER = [
  {
    answer: LONG_STRING,
    correct: true
  },
  {
    answer: 'Bob',
    correct: false
  }
];
const DUPE_ANSWER = [
  {
    answer: 'Yes',
    correct: true
  },
  {
    answer: 'Yes',
    correct: true,
  }
];
const NO_CORRECT_ANSWER = [
  {
    answer: 'Yes',
    correct: false
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
});

describe('/v1/admin/quiz/{quizid}/question, create quiz question test', () => {
  describe('error tests', () => {
    test('Token is of invalid structure', () => {
      const question = requestQuestionCreateV2(quiz.quizId, undefined, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(401);
      expect(question.retValue).toStrictEqual(ERROR);
    });
    test('Token is valid structure, but not for a currently logged in session', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token + 1, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(403);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to a valid quiz', () => {
      const question = requestQuestionCreateV2(quiz.quizId + 1, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to a quiz this user owns', () => {
      const user2 = requestAuthRegister('apple@gmail.com', 'abcd1234', 'Bobby', 'Smith').retValue;
      const question = requestQuestionCreateV2(quiz.quizId, user2.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Question string is too short', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, 'What', VALID_DURATION, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Question has less than 2 answers', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, INSUFFICIENT_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Question Duration is zero', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, 0, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Quiz total duration exceeds 3 minutes (180 seconds)', () => {
      requestQuestionCreateV2(quiz.quizId, user.token, 'How are you doing?', 91, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, 90, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Points assigned to question is greater than 10', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, 11, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('length of an answer is longer than 30 characters long', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, LONG_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Exists answer string duplicates', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, DUPE_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('There are no correct answers', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, NO_CORRECT_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('The thumbnailUrl is an empty string', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, '');
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('The thumbnailUrl does not return to a valid file', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, INVALID_URL);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('The thumbnailUrl is not a JPG or PNG file type', () => {
      const question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, INVALID_THUMBNAIL_URL_GIF);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });
  });

  describe('Success cases - checking return value', () => {
    test('Adding valid questions to quiz', () => {
      let question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
      expect(question.statusCode).toStrictEqual(200);

      question = requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, VALID_DURATION, VALID_POINTS, VALID_ANSWER, VALID_THUMBNAIL_URL);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
      expect(question.statusCode).toStrictEqual(200);
    });
  });

  describe('success cases - checking quizInfo for question data', () => {
    test('Adding questions to quiz', () => {
      requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, 5, 5, VALID_ANSWER, VALID_THUMBNAIL_URL);
      let quizInfo = requestQuizInfoV2(user.token, quiz.quizId).retValue;
      expect(quizInfo.questions).toStrictEqual([
        {
          questionId: expect.any(Number),
          question: VALID_QUESTION,
          duration: 5,
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
          ],
          thumbnailUrl: expect.any(String)
        }
      ]);
      requestQuestionCreateV2(quiz.quizId, user.token, VALID_QUESTION, 4, 6, VALID_ANSWER, VALID_THUMBNAIL_URL);
      quizInfo = requestQuizInfoV2(user.token, quiz.quizId).retValue;
      expect(quizInfo.questions).toStrictEqual([
        {
          questionId: expect.any(Number),
          question: VALID_QUESTION,
          duration: 5,
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
          ],
          thumbnailUrl: expect.any(String)
        },
        {
          questionId: expect.any(Number),
          question: VALID_QUESTION,
          duration: 4,
          points: 6,
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
          ],
          thumbnailUrl: expect.any(String)
        }
      ]);
    });
  });
});
