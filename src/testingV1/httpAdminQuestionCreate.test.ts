import { requestClear, requestAuthRegister, requestQuizInfo, requestQuizCreate, requestQuestionCreate } from '../requestHelpers';
type token = {
  token: string;
}
type quizid = {
  quizId: number;
}

type error = {
  error: string;
}
type questionId = {
  questionId: number;
}

type questionRet = {
  retValue: questionId | error;
  statusCode: number;
}
const ERROR = { error: expect.any(String) };
let user: token;
let quiz: quizid;
let question: questionRet;
const longString = 'a'.repeat(70);
const validQuestion = 'Which word means affirmative?';
const validAnswer = [
  {
    answer: 'Yes',
    correct: true
  },
  {
    answer: 'No',
    correct: false
  }
];
const insufficientAnswer = [
  {
    answer: 'Yes',
    correct: true
  }
];
const longAnswer = [
  {
    answer: longString,
    correct: true
  },
  {
    answer: 'Bob',
    correct: false
  }
];
const dupeAnswer = [
  {
    answer: 'Yes',
    correct: true
  },
  {
    answer: 'Yes',
    correct: true,
  }
];
const noCorrectAnswer = [
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
      question = requestQuestionCreate(quiz.quizId, null, validQuestion, 5, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(401);
      expect(question.retValue).toStrictEqual(ERROR);
    });
    test('Token is valid structure, but not for a currently logged in session', () => {
      question = requestQuestionCreate(quiz.quizId, user.token + 1, validQuestion, 5, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(403);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to a valid quiz', () => {
      question = requestQuestionCreate(quiz.quizId + 1, user.token, validQuestion, 5, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to a quiz this user owns', () => {
      const user2 = requestAuthRegister('apple@gmail.com', 'abcd1234', 'Bobby', 'Smith').retValue;
      question = requestQuestionCreate(quiz.quizId, user2.token, validQuestion, 5, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Question string is too short', () => {
      question = requestQuestionCreate(quiz.quizId, user.token, 'What', 5, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Question has less than 2 answers', () => {
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 5, insufficientAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Question Duration is zero', () => {
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 0, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Quiz total duration exceeds 3 minutes (180 seconds)', () => {
      requestQuestionCreate(quiz.quizId, user.token, 'How are you doing?', 91, 5, validAnswer);
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 90, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Points assigned to question is greater than 10', () => {
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 11, validAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('length of an answer is longer than 30 characters long', () => {
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 5, longAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('Exists answer string duplicates', () => {
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 5, dupeAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });

    test('There are no correct answers', () => {
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 5, noCorrectAnswer);
      expect(question.statusCode).toStrictEqual(400);
      expect(question.retValue).toStrictEqual(ERROR);
    });
  });

  describe('Success cases - checking return value', () => {
    test('Adding valid questions to quiz', () => {
      let question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(200);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(200);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
    });
    test('Adding questions to quiz with borderline durations', () => {
      let question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 1, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(200);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 179, 5, validAnswer);
      expect(question.statusCode).toStrictEqual(200);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
    });
    test('Adding questions to quiz with borderline points', () => {
      let question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 1, validAnswer);
      expect(question.statusCode).toStrictEqual(200);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
      question = requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 10, validAnswer);
      expect(question.statusCode).toStrictEqual(200);
      expect(question.retValue).toStrictEqual(
        {
          questionId: expect.any(Number)
        }
      );
    });
  });

  describe('success cases - checking quizInfo for question data', () => {
    test('Adding questions to quiz', () => {
      requestQuestionCreate(quiz.quizId, user.token, validQuestion, 5, 5, validAnswer);
      let quizInfo = requestQuizInfo(user.token, quiz.quizId).retValue;
      expect(quizInfo.questions).toStrictEqual([
        {
          questionId: expect.any(Number),
          question: validQuestion,
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
          ]
        }
      ]);
      requestQuestionCreate(quiz.quizId, user.token, validQuestion, 4, 6, validAnswer);
      quizInfo = requestQuizInfo(user.token, quiz.quizId).retValue;
      expect(quizInfo.questions).toStrictEqual([
        {
          questionId: expect.any(Number),
          question: validQuestion,
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
          ]
        },
        {
          questionId: expect.any(Number),
          question: validQuestion,
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
          ]
        }
      ]);
    });
  });
});
