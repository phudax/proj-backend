import { requestClear, requestQuizCreate, requestAuthRegister, requestAuthLogin, requestQuizList, requestOwnerTransfer } from '../requestHelpers';
import { requestOwnerTransferV2 } from '../iter3RequestHelpers';

const OK = 200;
const INPUT_ERROR = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const ERROR = { error: expect.any(String) };
const exampleName = 'examplename';
const exampleDescription = 'exampledescrption';

beforeEach(() => {
  requestClear();
});

function quizCreate() {
  requestClear();
  requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen');
  requestAuthRegister('john.doe@gmail.com', 'abcd1234', 'john', 'doe');
  const exampleToken = requestAuthLogin('jane.citizen@gmail.com', 'abcd1234').retValue.token;
  const exampleQuiz = requestQuizCreate(exampleToken, exampleName, exampleDescription).retValue.quizId;
  return {
    token: exampleToken,
    quizId: exampleQuiz
  };
}

describe('/v2/admin/quiz/:quizId/transfer tests', () => {
  describe('success cases', () => {
    test('successful return type', () => {
      const { token, quizId } = quizCreate();
      const response = requestOwnerTransferV2(token, 'john.doe@gmail.com', quizId);
      expect(response.retValue).toStrictEqual({});
      expect(response.statusCode).toEqual(OK);
    });
    test('successful transfering', () => {
      const { token, quizId } = quizCreate();
      const response = requestOwnerTransferV2(token, 'john.doe@gmail.com', quizId);
      const token2 = requestAuthLogin('john.doe@gmail.com', 'abcd1234').retValue.token;
      expect(response.statusCode).toEqual(OK);
      const quizzes = requestQuizList(token2);
      const returnValue = {
        quizzes: [
          {
            quizId: quizId,
            name: exampleName
          }
        ]
      };
      expect(quizzes.retValue).toEqual(returnValue);
    });
  });
  requestClear();
  describe('error cases', () => {
    test('invalid token type', () => {
      const quizId = quizCreate().quizId;
      const response = requestOwnerTransferV2(undefined, 'john.doe@gmail.com', quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(UNAUTHORIZED);
    });
    const { token, quizId } = quizCreate();
    test.each([
      { token: token + 'qwertyuiop' },
      { token: token + 'b' },
    ])('invalid token ($token)', ({ token }) => {
      const response = requestOwnerTransferV2(token, 'john.doe@gmail.com', quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(FORBIDDEN);
    });
    test.each([
      { quizId: quizId + 1 },
      { quizId: quizId - 1 },
    ])('invalid quizId ($quizId)', ({ quizId }) => {
      const token = quizCreate().token;
      const response = requestOwnerTransferV2(token, 'john.doe@gmail.com', quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
    test.each([
      { email: 'john.doe@gmail.com' + 'hello' },
      { email: 'john.doe@gmail.com' + 'q' }
    ])('invalid quizId ($quizId', ({ email }) => {
      const { token, quizId } = quizCreate();
      const response = requestOwnerTransferV2(token, email, quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
    test('Transfering a Quiz not Owned by the Current User', () => {
      const quizId = quizCreate().quizId;
      const exampleToken2 = requestAuthLogin('john.doe@gmail.com', 'abcd1234').retValue.token;
      requestAuthRegister('mike.citizen@gmail.com', 'abcd1234', 'mike', 'citizen');
      const response = requestOwnerTransferV2(exampleToken2, 'mike.citizen@gmail.com', quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
    test('Transfering a Quiz to a user who already has a quiz named the same', () => {
      const { token, quizId } = quizCreate();
      const exampleToken2 = requestAuthLogin('john.doe@gmail.com', 'abcd1234').retValue.token;
      requestQuizCreate(exampleToken2, exampleName, exampleDescription);
      const response = requestOwnerTransferV2(token, 'john.doe@gmail.com', quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
    test('email corresponds to current owner', () => {
      const { token, quizId } = quizCreate();
      const response = requestOwnerTransferV2(token, 'jane.citizen@gmail.com', quizId);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
  });
});

describe('/v1/admin/quiz/:quizId/transfer tests', () => {
  test('successful transfering', () => {
    const { token, quizId } = quizCreate();
    const response = requestOwnerTransfer(token, 'john.doe@gmail.com', quizId);
    const token2 = requestAuthLogin('john.doe@gmail.com', 'abcd1234').retValue.token;
    expect(response.statusCode).toEqual(OK);
    const quizzes = requestQuizList(token2);
    const returnValue = {
      quizzes: [
        {
          quizId: quizId,
          name: exampleName
        }
      ]
    };
    expect(quizzes.retValue).toEqual(returnValue);
  });
});
