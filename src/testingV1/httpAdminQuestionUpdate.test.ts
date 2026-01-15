import {
  requestClear,
  requestAuthRegister,
  requestQuizInfo,
  requestQuizCreate,
  requestQuestionCreate,
  requestQuestionUpdate
} from '../requestHelpers';

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
const shortString4 = 'a'.repeat(4);
const validQuestion1 = 'Which word means affirmative?';
const validQuestion2 = 'Which word means negative?';
const updatedQuestion1 = 'Who is in the Aero group?';
const updatedQuestion2 = 'Who is not in the Aero group?';

const validAnswer1 = [{ answer: 'Yes', correct: true }, { answer: 'No', correct: false }];
const validAnswer2 = [{ answer: 'No', correct: true }, { answer: 'Yes', correct: false }, { answer: 'Maybe', correct: false }];
const updatedAnswer1 = [{ answer: 'Phu', correct: true }, { answer: 'Gary', correct: false }, { answer: 'Will', correct: true }];
const updatedAnswer2 = [{ answer: 'Hien', correct: true }, { answer: 'Alex', correct: false }];

const shortAnswer = [{ answer: '', correct: true }, { answer: 'Bob', correct: false }];
const duplicateAnswer = [{ answer: 'Yes', correct: true }, { answer: 'Yes', correct: true }];
const noCorrectAnswer = [{ answer: 'Yes', correct: false }, { answer: 'No', correct: false }];
const insufficientAnswer = [{ answer: 'Yes', correct: true }];

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  requestClear();
  user1 = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz1 = requestQuizCreate(user1.token, 'President Quiz', 'Fun Quiz').retValue;
  question = requestQuestionCreate(quiz1.quizId, user1.token, validQuestion1, 5, 5, validAnswer1).retValue;
});

describe('Testing question update', () => {
  describe('error testing', () => {
    test('Token is invalid', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, undefined, validQuestion1, 5, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(401);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('Token is not current user', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token + 1, validQuestion1, 5, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(403);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });
    test('quizId is invalid', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId + 1, question.questionId, user1.token, validQuestion1, 5, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('quizId is not of current owner', () => {
      const user2 = requestAuthRegister('monkeymonkey@gmail.com', 'monkey1234', 'Jia', 'En').retValue;
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user2.token, validQuestion1, 5, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('questionId is invalid', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId + 1, user1.token, validQuestion1, 5, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question length is to short', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, shortString4, 5, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question answers is less than 2', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, validQuestion1, 5, 5, insufficientAnswer);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question duration is negative', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, validQuestion1, -1, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('Duration of quiz cannot exceed 3 minutes', () => {
      for (let i = 0; i < 17; i++) {
        requestQuestionCreate(quiz1.quizId, user1.token, validQuestion1, 10, 5, validAnswer1);
      }
      const question2 = requestQuestionCreate(quiz1.quizId, user1.token, validQuestion1, 1, 5, validAnswer1).retValue;
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question2.questionId, user1.token, validQuestion1, 10, 5, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('question points is to high', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, validQuestion1, 5, 11, validAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('answer is empty', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, validQuestion1, 5, 5, shortAnswer);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('answer is duplicate', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, validQuestion1, 5, 5, duplicateAnswer);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });

    test('answer has no correct', () => {
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, validQuestion1, 5, 5, noCorrectAnswer);
      expect(QuestionUpdate.statusCode).toStrictEqual(400);
      expect(QuestionUpdate.retValue).toStrictEqual(ERROR);
    });
  });
});

describe('Testing question update', () => {
  describe('success testing', () => {
    test('update quiz with two questions, check if total quiz duration is changed', () => {
      const Question2 = requestQuestionCreate(quiz1.quizId, user1.token, validQuestion2, 5, 5, validAnswer2).retValue;
      const QuestionUpdate = requestQuestionUpdate(quiz1.quizId, question.questionId, user1.token, updatedQuestion1, 6, 6, updatedAnswer1);
      expect(QuestionUpdate.statusCode).toStrictEqual(200);
      const QuestionUpdate2 = requestQuestionUpdate(quiz1.quizId, Question2.questionId, user1.token, updatedQuestion2, 10, 5, updatedAnswer2);
      expect(QuestionUpdate2.statusCode).toStrictEqual(200);
      expect(QuestionUpdate2.retValue).toStrictEqual({});
      const QuizInfo = requestQuizInfo(user1.token, quiz1.quizId).retValue;
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
            question: updatedQuestion1,
            duration: 6,
            points: 6,
            answers: [
              {
                answerId: expect.any(Number),
                answer: updatedAnswer1[0].answer,
                colour: expect.any(String),
                correct: updatedAnswer1[0].correct
              },
              {
                answerId: expect.any(Number),
                answer: updatedAnswer1[1].answer,
                colour: expect.any(String),
                correct: updatedAnswer1[1].correct
              },
              {
                answerId: expect.any(Number),
                answer: updatedAnswer1[2].answer,
                colour: expect.any(String),
                correct: updatedAnswer1[2].correct
              }
            ]
          },
          {
            questionId: expect.any(Number),
            question: updatedQuestion2,
            duration: 10,
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: updatedAnswer2[0].answer,
                colour: expect.any(String),
                correct: updatedAnswer2[0].correct
              },
              {
                answerId: expect.any(Number),
                answer: updatedAnswer2[1].answer,
                colour: expect.any(String),
                correct: updatedAnswer2[1].correct
              }
            ],
          }
        ],
        duration: 16
      });
    });
  });
});
