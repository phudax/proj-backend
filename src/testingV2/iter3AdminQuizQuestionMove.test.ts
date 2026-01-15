import { requestClear, requestAuthRegister, requestQuestionCreate, requestQuizCreate, requestMoveQuestion } from '../requestHelpers';
import { requestMoveQuestionV2, requestAuthLogoutV2 } from '../iter3RequestHelpers';
const ERROR = { error: expect.any(String) };

type token = {
  token: string;
}

type quiz = {
  quizId: number;
}

type question = {
  questionId: number;
}

beforeEach(() => {
  requestClear();
});

describe('/v2/admin/quiz/{quizid}/question/{questionid}/move tests', () => {
  describe('Success Cases', () => {
    let user1: token;
    let quiz1: quiz;
    let question1: question;
    let question2: question;
    let question3: question;
    beforeEach(() => {
      user1 = requestAuthRegister('jane.citizen@getMaxListeners.com', 'abcd1234', 'jane', 'citizen').retValue;
      quiz1 = requestQuizCreate(user1.token, 'COMP quiz', 'comp quiz description').retValue;
      question1 = requestQuestionCreate(quiz1.quizId, user1.token, 'question 1', 3, 3, [{ answer: 'answer1a', correct: true }, { answer: 'answer1b', correct: false }]).retValue;
      question2 = requestQuestionCreate(quiz1.quizId, user1.token, 'question 2', 3, 3, [{ answer: 'answer2a', correct: true }, { answer: 'answer2b', correct: false }]).retValue;
      question3 = requestQuestionCreate(quiz1.quizId, user1.token, 'question 3', 3, 3, [{ answer: 'answer3a', correct: true }, { answer: 'answer3b', correct: false }]).retValue;
    });

    test('Successfully move quiz question', () => {
      const move1 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, user1.token, 2);
      expect(move1.retValue).toStrictEqual({});
      expect(move1.statusCode).toStrictEqual(200);

      const move2 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, user1.token, 0);
      expect(move2.retValue).toStrictEqual({});
      expect(move2.statusCode).toStrictEqual(200);

      const move3 = requestMoveQuestionV2(quiz1.quizId, question3.questionId, user1.token, 1);
      expect(move3.retValue).toStrictEqual({});
      expect(move3.statusCode).toStrictEqual(200);

      const move4 = requestMoveQuestionV2(quiz1.quizId, question2.questionId, user1.token, 0);
      expect(move4.retValue).toStrictEqual({});
      expect(move4.statusCode).toStrictEqual(200);
    });

    test('ITERATION 2 COVERAGE test', () => {
      const move1 = requestMoveQuestion(quiz1.quizId, question1.questionId, user1.token, 2);
      expect(move1.retValue).toStrictEqual({});
      expect(move1.statusCode).toStrictEqual(200);
    });
  });

  describe('Error Cases', () => {
    let user1: token;
    let user2: token;
    let quiz1: quiz;
    let question1: question;
    let question2: question;
    beforeEach(() => {
      user1 = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      user2 = requestAuthRegister('jane.citizen1@gmail.com', 'abcd1234', 'jane', 'citizen').retValue;
      quiz1 = requestQuizCreate(user1.token, 'COMP quiz', 'comp quiz description').retValue;
      question1 = requestQuestionCreate(quiz1.quizId, user1.token, 'question 1', 3, 3, [{ answer: 'answer1a', correct: true }, { answer: 'answer1b', correct: false }]).retValue;
      question2 = requestQuestionCreate(quiz1.quizId, user1.token, 'question 2', 3, 3, [{ answer: 'answer2a', correct: true }, { answer: 'answer2b', correct: false }]).retValue;
    });

    test('Quiz ID does not refer to a valid quiz', () => {
      const move1 = requestMoveQuestionV2(quiz1.quizId + 1, question1.questionId, user1.token, 1);
      expect(move1.retValue).toStrictEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      const quiz2 = requestQuizCreate(user2.token, 'math quiz', 'math quiz description').retValue;
      const question3 = requestQuestionCreate(quiz2.quizId, user2.token, 'question 3', 3, 3, [{ answer: 'answer3', correct: true }]).retValue;
      requestQuestionCreate(quiz2.quizId, user2.token, 'question 4', 3, 3, [{ answer: 'answer4a', correct: true }, { answer: 'answer4b', correct: false }]);

      const move1 = requestMoveQuestionV2(quiz2.quizId, question3.questionId, user1.token, 1);
      expect(move1.retValue).toStrictEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(400);
    });

    test('Question Id does not refer to a valid question within this quiz', () => {
      const quiz2 = requestQuizCreate(user2.token, 'math quiz', 'math quiz description').retValue;
      const question3 = requestQuestionCreate(quiz2.quizId, user2.token, 'question 3', 3, 3, [{ answer: 'answer3a', correct: true }, { answer: 'answer3b', correct: false }]).retValue;
      const move1 = requestMoveQuestionV2(quiz1.quizId, question3.questionId, user1.token, 1);
      expect(move1.retValue).toStrictEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(400);
    });

    test('newPosition is less than 0', () => {
      const move1 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, user1.token, -1);
      expect(move1.retValue).toStrictEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(400);
    });

    test('newPosition is greater than n-1 where n is the number of questions', () => {
      const move1 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, user1.token, 2);
      expect(move1.retValue).toStrictEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(400);

      const move2 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, user1.token, 3);
      expect(move2.retValue).toStrictEqual(ERROR);
      expect(move2.statusCode).toStrictEqual(400);
    });

    test('newPosition is the position of the current question', () => {
      const move1 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, user1.token, 0);
      expect(move1.retValue).toStrictEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(400);

      const move2 = requestMoveQuestionV2(quiz1.quizId, question2.questionId, user1.token, 1);
      expect(move2.retValue).toStrictEqual(ERROR);
      expect(move2.statusCode).toStrictEqual(400);
    });

    test.each([
      { token: undefined },
    ])('token is not a valid structure status code tests', ({ token }) => {
      const move1 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, token as any, 1);
      expect(move1.retValue).toEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(401);
    });

    test('token is valid structure but is not for a currently logged in session', () => {
      requestAuthLogoutV2(user1.token);
      const move1 = requestMoveQuestionV2(quiz1.quizId, question1.questionId, user1.token, 1);
      expect(move1.retValue).toStrictEqual(ERROR);
      expect(move1.statusCode).toStrictEqual(403);
    });
  });
});
