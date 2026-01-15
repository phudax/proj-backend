
import { requestQuizCreate, requestClear, requestAuthRegister } from '../requestHelpers';
import { requestQuizInfoV2, requestQuizThumbnailUpdate } from '../iter3RequestHelpers';

const ERROR = { error: expect.any(String) };
type token = {
  token: string;
}
type quizid = {
  quizId: number;
}
type error = {
  error: string;
}
type updatereturn = {
  statusCode: number;
  retValue: error | Record<string, never>;
}
let user: token;
let quiz: quizid;
let updateReturn: updatereturn;
const VALID_THUMBNAIL_URL = 'https://upload.wikimedia.org/wikipedia/en/2/27/Bliss_%28Windows_XP%29.png';
const VALID_THUMBNAIL_URL_TWO = 'https://cdn.britannica.com/91/136491-050-AAACC3A5/Boomerang.jpg';
const INVALID_THUMBNAIL_TYPE = 'https://media.wired.com/photos/5b33354e572ae17d05ab1e55/master/w_1600%2Cc_limit/NyanCat.gif';
const INVALID_URL = 'https://cdn.britannica.csdadom/91/136491-050-AAACC3A5/Boomerang.jpg';

beforeEach(() => {
  requestClear();
  user = requestAuthRegister('z999999@gmail.com', 'abcd1234', 'Hayden', 'Smith').retValue;
  quiz = requestQuizCreate(user.token, 'President Quiz', 'Fun Quiz about presidents').retValue;
});

describe('/v1/admin/quiz/{quizid}/thumbnail, update quiz thumbnail tests', () => {
  describe('Error case tests', () => {
    test('Token is not a valid structure', () => {
      updateReturn = requestQuizThumbnailUpdate(quiz.quizId, undefined, VALID_THUMBNAIL_URL);
      expect(updateReturn.statusCode).toStrictEqual(401);
      expect(updateReturn.retValue).toStrictEqual(ERROR);
    });

    test('Token is valid structure, but not for a currently logged in session', () => {
      updateReturn = requestQuizThumbnailUpdate(quiz.quizId, user.token + 1, VALID_THUMBNAIL_URL);
      expect(updateReturn.statusCode).toStrictEqual(403);
      expect(updateReturn.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to a valid quiz', () => {
      updateReturn = requestQuizThumbnailUpdate(quiz.quizId + 1, user.token, VALID_THUMBNAIL_URL);
      expect(updateReturn.statusCode).toStrictEqual(400);
      expect(updateReturn.retValue).toStrictEqual(ERROR);
    });

    test('Quiz Id does not refer to a quiz that this user owns', () => {
      const user2 = requestAuthRegister('banana@gmail.com', 'abcd1234', 'Johnson', 'Wiley').retValue;
      const quiz2 = requestQuizCreate(user2.token, 'Space Quiz', 'Fun Quiz about space').retValue;
      updateReturn = requestQuizThumbnailUpdate(quiz2.quizId, user.token, VALID_THUMBNAIL_URL);
      expect(updateReturn.statusCode).toStrictEqual(400);
      expect(updateReturn.retValue).toStrictEqual(ERROR);
    });

    test('ImageURL when fetched does not return to a valid file', () => {
      updateReturn = requestQuizThumbnailUpdate(quiz.quizId, user.token, INVALID_URL);
      expect(updateReturn.statusCode).toStrictEqual(400);
      expect(updateReturn.retValue).toStrictEqual(ERROR);
    });

    test('ImageURL when fetched is not a JPG or PNG image', () => {
      updateReturn = requestQuizThumbnailUpdate(quiz.quizId, user.token, INVALID_THUMBNAIL_TYPE);
      expect(updateReturn.statusCode).toStrictEqual(400);
      expect(updateReturn.retValue).toStrictEqual(ERROR);
    });
  });

  describe('Success cases - checking return value and quiz info', () => {
    test('Successful update of a quiz thumbnail twice', () => {
      const localURL = requestQuizInfoV2(user.token, quiz.quizId).retValue.thumbnailUrl;
      updateReturn = requestQuizThumbnailUpdate(quiz.quizId, user.token, VALID_THUMBNAIL_URL_TWO);
      expect(updateReturn.statusCode).toStrictEqual(200);
      expect(updateReturn.retValue).toStrictEqual({});
      const quizInfo = requestQuizInfoV2(user.token, quiz.quizId).retValue;
      expect(quizInfo.thumbnailUrl).not.toEqual(localURL);
      const updatedLocalURL = quizInfo.thumbnailUrl;
      updateReturn = requestQuizThumbnailUpdate(quiz.quizId, user.token, VALID_THUMBNAIL_URL);
      expect(updateReturn.statusCode).toStrictEqual(200);
      expect(updateReturn.retValue).toStrictEqual({});
      const quizInfo2 = requestQuizInfoV2(user.token, quiz.quizId).retValue;
      expect(quizInfo2.thumbnailUrl).not.toEqual(updatedLocalURL);
    });
  });
});
