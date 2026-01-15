import { requestClear, requestAuthRegister, requestQuizRemove, requestTrashEmpty } from '../requestHelpers';
import { requestTrashEmptyV2, requestQuizCreateV2, requestQuizTrashV2 } from '../iter3RequestHelpers';

const OK = 200;
const INPUT_ERROR = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const ERROR = { error: expect.any(String) };
const exampleName = 'examplename';
const exampleName2 = 'examplename2';
const exampleName3 = 'examplename3';
const exampleDescription = 'exampledescrption';

let token: string;
let quizId1: number;
beforeEach(() => {
  requestClear();
  token = requestAuthRegister('jane.citizen@gmail.com', 'abcd1234', 'jane', 'citizen').retValue.token;
  quizId1 = requestQuizCreateV2(token, exampleName, exampleDescription).retValue.quizId;
});

describe('/v2/admin/quiz/trash/empty', () => {
  describe('Error Cases', () => {
    test('invalid Token Type', () => {
      requestQuizRemove(token, quizId1);
      const response = requestTrashEmptyV2(undefined, `[${quizId1}]`);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(UNAUTHORIZED);
    });
    test('trying to remove when one or more quizzes are not in trash', () => {
      const quizId2 = requestQuizCreateV2(token, exampleName2, exampleDescription).retValue.quizId;
      const quizId3 = requestQuizCreateV2(token, exampleName3, exampleDescription).retValue.quizId;
      requestQuizRemove(token, quizId1);
      const response = requestTrashEmptyV2(token, `[${quizId1}, ${quizId2}, ${quizId3}]`);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
    test('trying to empty a quiz from trash with a non-matching user Id', () => {
      const token2 = requestAuthRegister('jane.citizen1@gmail.com', 'abcd1234', 'jan', 'citisen').retValue.token;
      requestQuizRemove(token, quizId1);
      const response = requestTrashEmptyV2(token2, `[${quizId1}]`);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
    test('removing a quiz from a null list', () => {
      const response = requestTrashEmptyV2(token, `[${Math.random()}]`);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(INPUT_ERROR);
    });
    test('token is valid structure, but not for a currently logged in session', () => {
      requestQuizRemove(token, quizId1);
      const response = requestTrashEmptyV2(token + 'a', `[${quizId1}]`);
      expect(response.retValue).toEqual(ERROR);
      expect(response.statusCode).toEqual(FORBIDDEN);
    });
  });
  describe('Success Cases', () => {
    test('Success return type', () => {
      requestQuizRemove(token, quizId1);
      const response = requestTrashEmptyV2(token, `[${quizId1}]`);
      expect(response.retValue).toStrictEqual({});
      expect(response.statusCode).toEqual(OK);
    });
    test('successful removal of singlualar quiz from singular trash array', () => {
      requestQuizRemove(token, quizId1);
      const response = requestTrashEmptyV2(token, `[${quizId1}]`);
      expect(response.retValue).toStrictEqual({});
      expect(response.statusCode).toEqual(OK);
      const trash = requestQuizTrashV2(token).retValue.quizzes;
      expect(trash.length).toEqual(0);
    });
    test('successful removal of singlular quiz from non singular trash', () => {
      const quizId2 = requestQuizCreateV2(token, exampleName2, exampleDescription).retValue.quizId;
      requestQuizRemove(token, quizId1);
      requestQuizRemove(token, quizId2);
      const response = requestTrashEmptyV2(token, `[${quizId1}]`);
      expect(response.retValue).toStrictEqual({});
      expect(response.statusCode).toEqual(OK);
      const trash = requestQuizTrashV2(token).retValue.quizzes;
      expect(trash).toEqual([
        {
          quizId: quizId2,
          name: exampleName2
        }
      ]);
    });
    test('successfully removing n quizzes from a trash of n size', () => {
      const quizId2 = requestQuizCreateV2(token, exampleName2, exampleDescription).retValue.quizId;
      const quizId3 = requestQuizCreateV2(token, exampleName3, exampleDescription).retValue.quizId;
      requestQuizRemove(token, quizId1);
      requestQuizRemove(token, quizId2);
      requestQuizRemove(token, quizId3);
      expect(requestQuizTrashV2(token).retValue.quizzes.length).toEqual(3);
      const response = requestTrashEmptyV2(token, `[${quizId1}, ${quizId2}, ${quizId3}]`);
      expect(response.retValue).toStrictEqual({});
      expect(response.statusCode).toEqual(OK);
      expect(requestQuizTrashV2(token).retValue.quizzes).toEqual([]);
    });
    test('successfully removing not-n quizzes from a trash of n size', () => {
      const quizId2 = requestQuizCreateV2(token, exampleName2, exampleDescription).retValue.quizId;
      const quizId3 = requestQuizCreateV2(token, exampleName3, exampleDescription).retValue.quizId;
      requestQuizRemove(token, quizId1);
      requestQuizRemove(token, quizId2);
      requestQuizRemove(token, quizId3);
      expect(requestQuizTrashV2(token).retValue.quizzes.length).toEqual(3);
      const response = requestTrashEmptyV2(token, `[${quizId1}, ${quizId2}]`);
      expect(response.retValue).toStrictEqual({});
      expect(response.statusCode).toEqual(OK);
      expect(requestQuizTrashV2(token).retValue.quizzes.length).toEqual(1);
    });
  });
});
describe('/v1/admin/quiz/trash/empty', () => {
  test('success case', () => {
    requestQuizRemove(token, quizId1);
    const response = requestTrashEmpty(token, `[${quizId1}]`);
    expect(response.retValue).toStrictEqual({});
    expect(response.statusCode).toEqual(200);
  });
});
