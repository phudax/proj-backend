import {
  getData,
  setData,
  STATE,
  COMMANDS,
  Player,
  Quiz,
  QuizSession,
} from './dataStore';
import { getRandomNum } from './auth';
import { port, url } from './config.json';
const SERVER_URL = `${url}:${port}`;
import UUID from 'uuid-int';
import HTTPError from 'http-errors';
import request from 'sync-request';
import fs from 'fs';
import path from 'path';

const id = 0;
const generator = UUID(id);
const NOT_FOUND = -1;

type inputAnswer = {
  answer: string;
  correct: boolean;
}

export type message = {
  messageBody: string;
}

/**
 * Restores a quiz from trash to active quizzes
 * @param {number} quizId - id of quiz to restore
 * @param {string} token - sessionId
 * @returns {{}} - empty object
 */
export function adminQuizRestoreV2(quizId: number, token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }

  const data = getData();
  const tokenIndex2 = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex2 === NOT_FOUND) {
    throw HTTPError(403, 'token is valid structure, but is not for a currently logged in session');
  }

  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  const trashQuizIndex = data.trash.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND && trashQuizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }

  if (quizIndex === NOT_FOUND) {
    const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
    const ownerId = data.tokens[tokenIndex].userId;
    if (data.trash[trashQuizIndex].ownerUserId !== ownerId) {
      throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
    }
  } else {
    const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
    const ownerId = data.tokens[tokenIndex].userId;
    if (data.quizzes[quizIndex].ownerUserId !== ownerId) {
      throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
    }
  }

  if (trashQuizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID refers to a quiz that is not currently in the trash');
  }
  data.trash[trashQuizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  const restoredQuiz = data.trash[trashQuizIndex];
  data.trash.splice(trashQuizIndex, 1);
  data.quizzes.push(restoredQuiz);
  setData(data);
  return {};
}

/**
 * Create a new quiz given the users token, a name and description
 * @param {string} token - SessionId
 * @param {string} name- desired name for the new quiz
 * @param {string} description- desired description for the new quiz
 * @returns {quizId: number} - object containing the unique Id for that quiz
 */
export function adminQuizCreateV2(token: string, name: string, description: string) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const tokenIndex = data.tokens.findIndex(session => session.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'token is valid structure, but is not for a currently logged in session');
  }
  const userId = data.tokens[tokenIndex].userId;
  if (nameUniquenessCheck(name, userId) === false) {
    throw HTTPError(400, 'Name is already used by user for another quiz');
  } else if ((name.length < 3) || (name.length > 30)) {
    throw HTTPError(400, 'name must be between 3 and 30 characters long');
  } else if ((/^[A-Za-z0-9\s]+$/.test(name)) === false) {
    throw HTTPError(400, 'name must only contain alphanumeric character and no spaces');
  } else if (description.length > 100) {
    throw HTTPError(400, 'description must be 100 character of less');
  }
  const newQuizId = generator.uuid();

  const newQuiz: Quiz = {
    quizId: newQuizId,
    name: name,
    ownerUserId: userId,
    description: description,
    numQuestions: 0,
    questions: [],
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    duration: 0,
    thumbnailUrl: ''
  };
  data.quizzes.push(newQuiz);
  setData(data);
  return {
    quizId: newQuizId
  };
}

/**
 * Transfers a user's quiz to another user
 * @param {string} token:sessionId
 * @param {string} email- new UserEmail
 * @param {number} quizId- id of quiz that needs to be altered
 * @returns {}
 */
export function adminOwnerTransferV2(token: string, quizId: number, email: string) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const tokenIndex = data.tokens.findIndex(session => session.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Invalid SessionId');
  }
  const quizIndex = data.quizzes.findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'invalid QuizId');
  }
  const OldUserId = data.tokens[tokenIndex].userId;
  const oldUserIndex = data.users.findIndex(users => users.userId === OldUserId);
  if (email === data.users[oldUserIndex].email) {
    throw HTTPError(400, 'email address corresponds to current owner');
  }
  if (data.quizzes[quizIndex].ownerUserId !== OldUserId) {
    throw HTTPError(400, 'User is not the owner of this quiz');
  }

  const newUserIndex = data.users.findIndex(users => users.email === email);
  if (newUserIndex === NOT_FOUND) {
    throw HTTPError(400, 'There is no user with the given email');
  }

  const newUserId = data.users[newUserIndex].userId;
  const quizName = data.quizzes[quizIndex].name;
  if (nameUniquenessCheck(quizName, newUserId) === false) {
    throw HTTPError(400, 'New owner already has a quiz with an identical name');
  }

  data.quizzes[quizIndex].ownerUserId = newUserId;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return {};
}

/**
/** Moves question with given questionId from current position to new position in a given quiz
 * @param {number} quizId - id of quiz that question belongs to
 * @param {number} questionId - id of question to move
 * @param {string} token - id of quiz owner
 * @param {number} newPosition - position in answer array to move question to
 * @returns {} - empty object
 */
export function adminMoveQuestionV2(quizId: number, questionId: number, token: string, newPosition: number) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }

  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'token is valid structure, but is not for a currently logged in session');
  }

  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }

  const ownerId = data.tokens[tokenIndex].userId;
  if (data.quizzes[quizIndex].ownerUserId !== ownerId) {
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const questionIndex = data.quizzes[quizIndex].questions.findIndex(item => item.questionId === questionId);

  if (questionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  const nQuestions = data.quizzes[quizIndex].questions.length;
  if (newPosition < 0 || newPosition > nQuestions - 1) {
    throw HTTPError(400, 'invalid newPosition');
  }

  if (newPosition === questionIndex) {
    throw HTTPError(400, 'newPosition is the position of the current question');
  }

  const tempQuestion = data.quizzes[quizIndex].questions[questionIndex];
  data.quizzes[quizIndex].questions.splice(questionIndex, 1);
  data.quizzes[quizIndex].questions.splice(newPosition, 0, tempQuestion);

  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);
  return {};
}

export function adminTrashEmptyV2(token: string, quizIdsString: string) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const tokenIndex = data.tokens.findIndex(user => user.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'token is valid structure, but is not for a currently logged in session');
  }
  quizIdsString = quizIdsString.substring(1, quizIdsString.length - 1);
  const temp = quizIdsString.split(',');
  const quizIds = temp.map((Id) => parseInt(Id, 10));
  const userId = data.tokens[tokenIndex].userId;
  const quizIndexes: Array<number> = [];
  for (const id of quizIds) {
    const quizIndex = data.trash.findIndex(obj => obj.quizId === id);
    if (quizIndex !== NOT_FOUND) {
      quizIndexes.push(quizIndex);
    } else {
      throw HTTPError(400, 'Invalid QuizIds');
    }
  }
  for (const index of quizIndexes) {
    const quiz = data.trash[index];
    if (quiz.ownerUserId !== userId) {
      throw HTTPError(400, 'Invalid UserId for QuizIds');
    }
  }
  quizIndexes.sort((a, b) => b - a);
  quizIndexes.forEach(index => {
    data.trash.splice(index, 1);
  });
  setData(data);
  return {};
}

export function adminQuizRemoveV2(token: string, quizId: number) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'token is valid structure, but is not for a currently logged in session');
  }
  const quizIdList = (data.quizzes).map(a => a.quizId);
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);

  const userId = data.tokens[tokenIndex].userId;
  if (!quizIdList.includes(quizId)) {
    throw HTTPError(400, 'No quiz with quizId exists');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'This user is not the owner of the quiz');
  }

  if (data.quizSessions !== undefined) {
    const sessionCheck = data.quizSessions.some((session) => session.metadata.quizId === quizId && session.state !== STATE.END);
    if (sessionCheck) {
      throw HTTPError(400, 'Quiz is currently in use');
    }
  }

  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  const newQuiz = data.quizzes[quizIndex];
  data.trash.push(newQuiz);
  data.quizzes.splice(quizIndex, 1);
  setData(data);
  return {};
}

/**
 * Changes the name of a quiz when given the quiz id and the user token
 * @param {string} token - session Id
 * @param {number} quizId - Id of desired quiz
 * @param {string} name - new name of quiz
 * @returns {} no return value
 */
export function adminQuizNameUpdateV2(token: string, quizId: number, name: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }
  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'No quiz with quizId exists');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'User does not own this quiz');
  }
  if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
    throw HTTPError(400, 'Name contains any characters that are not alphanumeric or are spaces');
  }
  if (name.length < 3 || name.length > 30) {
    throw HTTPError(400, 'Name is either less than 3 characters long or more than 30 characters long');
  }
  for (const quiz of data.quizzes) {
    if (quiz.name === name && quiz.ownerUserId === userId) {
      throw HTTPError(400, 'Name is already used by the current logged in user for another quiz');
    }
  }
  const timeNow = Math.floor(Date.now() / 1000);

  data.quizzes[quizIndex].name = name;
  data.quizzes[quizIndex].timeLastEdited = timeNow;
  setData(data);
  return {};
}

/**
 * Returns the information for quiz when given the user Id and the quiz ID
 * @param {string} token - session Id
 * @param {number} quizId - Quiz Id
 * @returns {quizId: number}    desired Quiz Id
 * @returns {name: string}      name of the desired quiz
 * @returns {timeCreated: number}   time the quiz was created
 * @returns {timeLastEdited: number}    time the quiz was last edited
 * @returns {description: string} description of the specified quiz
 * @returns {numQuestions: number} number of questions
 * @returns {questions: Question[]} list of questions and their answers
 * @returns {duration: number} total duration of quiz (sum of duration of questions)
 */
export function adminQuizInfoV2(token: string, quizId: number) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }
  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'No quiz with quizId exists');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'User does not own this quiz');
  } else {
    return {
      quizId: quizId,
      name: data.quizzes[quizIndex].name,
      timeCreated: data.quizzes[quizIndex].timeCreated,
      timeLastEdited: data.quizzes[quizIndex].timeLastEdited,
      description: data.quizzes[quizIndex].description,
      numQuestions: data.quizzes[quizIndex].numQuestions,
      questions: data.quizzes[quizIndex].questions,
      duration: data.quizzes[quizIndex].duration,
      thumbnailUrl: data.quizzes[quizIndex].thumbnailUrl
    };
  }
}

/**
* Provide a list of all quizzes that are owned by the currently logged in user.
 * @param {string} token - session Id
 * @returns {array} array of all quizzes owned by given user
*/
export function adminQuizListV2(token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }

  const data = getData();
  const tokenId = data.tokens.find(item => item.sessionId === token);
  if (!tokenId) {
    throw HTTPError(403, 'Token is valid structure, but is not for a currently logged in session');
  }

  // get quizzes owned by user
  const userQuiz = data.quizzes.filter((item: {ownerUserId: number}) => item.ownerUserId === tokenId.userId);

  // get quizId and name of quiz
  const quizzes = userQuiz.map((quiz: {quizId: number, name: string}) => ({
    quizId: quiz.quizId,
    name: quiz.name,
  }));

  setData(data);
  return {
    quizzes: quizzes
  };
}

/**
 * Given details about the question and a valid token, create a question in the quiz with the input quizId.
 * @param {number} quizId - Id of quiz
 * @param {string} token - token of current user session
 * @param {string} question - the question string
 * @param {number} duration - length that question is displayed in seconds
 * @param {number} points - number of points for getting question correct
 * @param {inputAnswer} answers - object containing possible answers and whether they are correct
 * @param {string} thumbnailUrl - url link of thumbnail image
 * @returns {questionId: number} - id of question
 */
export function adminQuestionCreateV2(quizId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[], thumbnailUrl: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }

  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'No quiz with quizId exists');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'User does not own this quiz');
  }
  if (question.length < 5 || question.length > 50) {
    throw HTTPError(400, 'Question string is too short/long');
  }
  if (answers.length < 2 || answers.length > 6) {
    throw HTTPError(400, 'Too many/less answers');
  }
  if (duration <= 0) {
    throw HTTPError(400, 'Duration is not a positive number or is zero');
  }
  if (duration + data.quizzes[quizIndex].duration > 180) {
    throw HTTPError(400, 'Duration of the quiz cannot exceed 3 minutes');
  }
  if (points < 1 || points > 10) {
    throw HTTPError(400, 'Too many/less points');
  }
  const answerStringList = answers.map(answers => answers.answer);
  for (const answerString of answerStringList) {
    if (answerString.length < 1 || answerString.length > 30) {
      throw HTTPError(400, 'Length of an answer is too short/long');
    }
  }
  for (let i = 0; i < answerStringList.length; i++) {
    for (let j = i + 1; j < answerStringList.length; j++) {
      if (answerStringList[i] === answerStringList[j]) {
        throw HTTPError(400, 'There exists an answer string that is a duplicate of another');
      }
    }
  }
  const answerBooleanList = answers.map(answers => answers.correct);
  let trueDetectedFlag = false;
  for (const value of answerBooleanList) {
    if (value === true) {
      trueDetectedFlag = true;
      break;
    }
  }
  if (trueDetectedFlag === false) {
    throw HTTPError(400, 'There are no correct answers');
  }
  if (thumbnailUrl === '') {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }
  if (!thumbnailUrl.includes('.png') && !thumbnailUrl.includes('.jpg') && !thumbnailUrl.includes('.jpeg')) {
    throw HTTPError(400, 'The thumbnailUrl is not a jpg or png file type');
  }

  const imageDirectoryLink = storeImage(thumbnailUrl, generator.uuid().toString());
  const link = SERVER_URL + '/' + imageDirectoryLink;

  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  data.quizzes[quizIndex].duration = data.quizzes[quizIndex].duration + duration;
  data.quizzes[quizIndex].numQuestions++;
  const generatedQuestionId = generator.uuid();
  const randomColours = generateRandomColourOrder();
  const answerDetails = answers.map(a => ({
    answerId: generator.uuid(),
    answer: a.answer,
    colour: randomColours[answerStringList.findIndex(string => string === a.answer)],
    correct: a.correct
  }));
  const questionDetails = {
    questionId: generatedQuestionId,
    question: question,
    duration: duration,
    points: points,
    answers: answerDetails,
    thumbnailUrl: link
  };
  data.quizzes[quizIndex].questions.push(questionDetails);
  setData(data);
  return { questionId: generatedQuestionId };
}

/**
 * Duplicates a question in the quiz given valid Ids of token, quiz and question
 * @param {number} quizId - quiz Id
 * @param {number} questionId - question Id
 * @param {string} token - token of user session
 * @returns {newQuestionId: number} - id of question
 */
export function adminQuestionDuplicateV2(quizId: number, questionId: number, token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'No quiz with quizId exists');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'User does not own this quiz');
  }

  const questionIdList = data.quizzes[quizIndex].questions.map(question => question.questionId);
  if (!questionIdList.includes(questionId)) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  data.quizzes[quizIndex].numQuestions++;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  const questionIndex = data.quizzes[quizIndex].questions.findIndex(question => question.questionId === questionId);
  const questionDupe = { ...data.quizzes[quizIndex].questions[questionIndex] };

  data.quizzes[quizIndex].duration = data.quizzes[quizIndex].duration + questionDupe.duration;
  if (data.quizzes[quizIndex].duration > 180) {
    throw HTTPError(400, 'Quiz duration cannot exceed 180 seconds');
  }

  const newId = generator.uuid();
  questionDupe.questionId = newId;
  data.quizzes[quizIndex].questions.splice(questionIndex + 1, 0, questionDupe);
  setData(data);

  return { newQuestionId: newId };
}

/**
 * Deleting a question from quiz
 * @param quizId - ID of quiz
 * @param questionId - ID of question
 * @param token - token of useer
 * @returns {} - empty object
 */
export function adminQuestionDeleteV2(quizId: number, questionId: number, token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }

  const data = getData();

  const tokenId = data.tokens.find(item => item.sessionId === token);
  if (!tokenId) {
    throw HTTPError(403, 'Token is valid a valid structure, but is not currently logged in session');
  }

  const userQuiz = data.quizzes.find(item => item.quizId === quizId);

  if (!userQuiz) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }

  if (userQuiz.ownerUserId !== tokenId.userId) {
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const question = userQuiz.questions.findIndex(item => item.questionId === questionId);
  if (question === NOT_FOUND) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  // Check for active sessions related to the quiz
  const activeSessions = data.quizSessions.filter(session => session.metadata.quizId === quizId && session.state !== STATE.END);

  // If there are active sessions, throw an error
  if (activeSessions.length > 0) {
    throw HTTPError(400, 'All sessions for this quiz must be in END state before deleting a question');
  }
  const questionDuration = userQuiz.questions[question].duration;
  // remove question
  userQuiz.questions.splice(question, 1);

  userQuiz.duration = userQuiz.duration - questionDuration;
  userQuiz.numQuestions--;
  userQuiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return {};
}

/**
 * starts a new quiz session
 * @param {number} quizId - quiz Id
 * @param {string} token - user session Id
 * @param {number} autoStartNum - number of people that need to join to auto start quiz session
 * @returns {{ sessionId: number }} - id of new quiz session
 */
export function adminQuizNewSession(quizId: number, token: string, autoStartNum: number) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'User does not own this quiz');
  }
  if (autoStartNum > 50) {
    throw HTTPError(400, 'autoStartNum greater than 50');
  }

  const activeSessionsList = data.quizSessions.filter(function(session) {
    return session.state !== STATE.END;
  });
  if (activeSessionsList.length >= 10) {
    throw HTTPError(400, 'a maximum of 10 sessions that are not in END state currently exist');
  }
  if (data.quizzes[quizIndex].questions.length === 0) {
    throw HTTPError(400, 'The quiz does not have any questons in it');
  }

  const quizCopy = JSON.parse(JSON.stringify(data.quizzes[quizIndex]));

  const newQuizSessionId = getRandomNum();
  const newQuizSession: QuizSession = {
    sessionId: newQuizSessionId,
    state: STATE.LOBBY,
    atQuestion: 0,
    timeQuestionLastOpened: 0,
    players: [],
    metadata: quizCopy,
    messages: [],
  };
  data.quizSessions.push(newQuizSession);
  setData(data);

  return {
    sessionId: newQuizSessionId,
  };
}

/**
 * starts a new quiz session
 * @param {number} quizId - quiz Id
 * @param {number} sessionId - quiz session id
 * @param {string} token - user session Id
 * @param {COMMANDS} action - action to move to new session state
 * @returns {{}} - returns empty object
 */
export function adminUpdateSessionState(quizId: number, sessionId: number, token: string, action: string | COMMANDS) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }

  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const sessionIndex = data.quizSessions.findIndex(item => item.sessionId === sessionId);
  if (sessionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Session Id does not refer to a valid question within this quiz');
  }
  if (!Object.values(COMMANDS).includes(action as COMMANDS)) {
    throw HTTPError(400, 'Action provided is not a valid Action enum');
  }

  const currentState = data.quizSessions[sessionIndex].state;
  if (action === COMMANDS.NEXT_QUESTION) {
    if (currentState === STATE.QUESTION_COUNTDOWN || currentState === STATE.FINAL_RESULTS || currentState === STATE.END || currentState === STATE.QUESTION_OPEN) {
      throw HTTPError(400, 'next_question action enum cannot be applied in the current state');
    }
  }

  if (action === COMMANDS.GO_TO_ANSWER) {
    if (currentState === STATE.LOBBY || currentState === STATE.QUESTION_COUNTDOWN || currentState === STATE.FINAL_RESULTS || currentState === STATE.END || currentState === STATE.ANSWER_SHOW) {
      throw HTTPError(400, 'go_to_answer action enum cannot be applied in the current state');
    }
  }

  if (action === COMMANDS.GO_TO_FINAL_RESULTS) {
    if (currentState !== STATE.QUESTION_CLOSE && currentState !== STATE.ANSWER_SHOW) {
      throw HTTPError(400, 'go_to_final_results action enum cannot be applied in the current state');
    }
  }

  if (action === COMMANDS.END && currentState === STATE.END) {
    throw HTTPError(400, 'END action enum cannot be applied in the current state');
  }

  if (action === COMMANDS.NEXT_QUESTION) {
    data.quizSessions[sessionIndex].atQuestion += 1;
    data.quizSessions[sessionIndex].state = STATE.QUESTION_COUNTDOWN;
    setData(data);

    const currQuestionDuration = data.quizSessions[sessionIndex].metadata.questions[data.quizSessions[sessionIndex].atQuestion - 1].duration;

    setTimeout(() => {
      try {
        const data2 = getData();
        if (data2.quizSessions.length !== 0) {
          if (data2.quizSessions.length <= sessionIndex) {
            throw HTTPError(400, 'quizSession cleared before timeout finished');
          } else if (data.quizSessions[sessionIndex].sessionId !== data2.quizSessions[sessionIndex].sessionId) {
            throw HTTPError(400, 'quizSession is completely different');
          }

          if (data2.quizSessions[sessionIndex].state !== STATE.END && data2.quizSessions[sessionIndex].state === STATE.QUESTION_COUNTDOWN) {
            data2.quizSessions[sessionIndex].state = STATE.QUESTION_OPEN;
            data2.quizSessions[sessionIndex].timeQuestionLastOpened = Date.now();
            setData(data2);
          } else {
            throw HTTPError(400, 'FIRST CHECK NEXT_QUESTION action enum cannot be applied in the current state');
          }
        } else {
          throw HTTPError(400, 'quizSessions cleared before timeout finished');
        }
      } catch (error) {
      }
    }, 100);

    setTimeout(() => {
      try {
        const data3 = getData();
        if (data3.quizSessions.length !== 0) {
          if (data3.quizSessions.length <= sessionIndex) {
            throw HTTPError(400, 'quizSession cleared before timeout finished');
          } else if (data.quizSessions[sessionIndex].sessionId !== data3.quizSessions[sessionIndex].sessionId) {
            throw HTTPError(400, 'quizSession is completely different');
          }

          if (data3.quizSessions[sessionIndex].state !== STATE.END && data.quizSessions[sessionIndex].state !== STATE.ANSWER_SHOW && data3.quizSessions[sessionIndex].state === STATE.QUESTION_OPEN) {
            data3.quizSessions[sessionIndex].state = STATE.QUESTION_CLOSE;
            setData(data3);
          } else {
            throw HTTPError(400, 'SECOND CHECK NEXT_QUESTION action enum cannot be applied in the current state');
          }
        } else {
          throw HTTPError(400, 'quizSessions cleared before timeout finished');
        }
      } catch (error) {
      }
    }, currQuestionDuration * 1000 + 100);

    return {};
  } else {
    if (action === COMMANDS.END) {
      data.quizSessions[sessionIndex].atQuestion = 0;
      data.quizSessions[sessionIndex].state = STATE.END;
    } else if (action === COMMANDS.GO_TO_ANSWER) {
      data.quizSessions[sessionIndex].state = STATE.ANSWER_SHOW;
    } else if (action === COMMANDS.GO_TO_FINAL_RESULTS) {
      data.quizSessions[sessionIndex].state = STATE.FINAL_RESULTS;
      data.quizSessions[sessionIndex].atQuestion = 0;
    }
    setData(data);
    return {};
  }
}

/**
 * Allows a guest player to join a session of a quiz
 * @param {number} sessionId - sessionId of the session
 * @param {string} name - name of player that is joining
 * @returns {{playerId: number}} - id of player
 */
export function adminPlayerJoin(sessionId: number, name: string) {
  const data = getData();
  const sessionIndex = data.quizSessions.findIndex(session => session.sessionId === sessionId);
  if (sessionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Session cannot be found');
  }
  const nameList = data.quizSessions[sessionIndex].players.map(player => player.name);
  if (nameList.includes(name)) {
    throw HTTPError(400, 'Name is already in use by another player');
  }
  const sessionState = data.quizSessions[sessionIndex].state;
  if (sessionState !== STATE.LOBBY) {
    throw HTTPError(400, 'Session is not in LOBBY state');
  }
  let playerName = name;
  if (playerName === '') {
    let validNameFound = false;
    while (validNameFound === false) {
      playerName = generateRandomName();
      if (!nameList.includes(playerName)) {
        validNameFound = true;
      }
    }
  }
  const quizInfo = data.quizSessions[sessionIndex].metadata;
  const numQuestions = quizInfo.numQuestions;
  const empty2DArray = Array(numQuestions).fill([]);
  const emptyArray = Array(numQuestions).fill();
  const id = generator.uuid();
  const newPlayer: Player = {
    playerId: id,
    name: playerName,
    answers: empty2DArray,
    timeTakenAnswer: emptyArray,
    correct: emptyArray,
  };
  data.quizSessions[sessionIndex].players.push(newPlayer);
  setData(data);
  return {
    playerId: id
  };
}

/**
 * Returns the status of the sesssion the current player is in
 * @param {number} playerId - playerId
 * @returns {STATE} state - state of the player's quiz
 * @returns {number} numQuestions - total number of questions in the current quiz
 * @returns {number} atQuestion - current question that the player is on
 */

export function adminQuestionUpdateV2(quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[], thumbnailUrl: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }

  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
  }
  const questionIndex = data.quizzes[quizIndex].questions.findIndex(item => item.questionId === questionId);
  if (questionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }
  // error checking
  if (question.length < 5 || question.length > 50) {
    throw HTTPError(400, 'Question string is less than 5 characters in length or greater than 50 characters in length');
  }
  if (answers.length < 2 || answers.length > 6) {
    throw HTTPError(400, 'The question has more than 6 answers or less than 2 answers');
  }
  if (duration <= 0) {
    throw HTTPError(400, 'The question duration is not a positive number');
  }
  let totalQuizDuration = data.quizzes[quizIndex].duration;
  totalQuizDuration -= data.quizzes[quizIndex].questions[questionIndex].duration;
  totalQuizDuration += duration;
  if (totalQuizDuration > 180) {
    throw HTTPError(400, 'If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes');
  }
  if (points < 1 || points > 10) {
    throw HTTPError(400, 'The points awarded for the question are less than 1 or greater than 10');
  }
  const answerStringList = answers.map(answers => answers.answer);
  for (const answerString of answerStringList) {
    if (answerString.length < 1 || answerString.length > 30) {
      throw HTTPError(400, 'The length of any answer is shorter than 1 character long, or longer than 30 characters long');
    }
  }
  for (let i = 0; i < answerStringList.length; i++) {
    for (let j = i + 1; j < answerStringList.length; j++) {
      if (answerStringList[i] === answerStringList[j]) {
        throw HTTPError(400, 'Any answer strings are duplicates of one another (within the same question)');
      }
    }
  }
  const answerBooleanList = answers.map(answers => answers.correct);
  let trueDetectedFlag = false;
  for (const value of answerBooleanList) {
    if (value === true) {
      trueDetectedFlag = true;
      break;
    }
  }
  if (trueDetectedFlag === false) {
    throw HTTPError(400, 'There are no correct answers');
  }
  if (thumbnailUrl === '') {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }

  if (!thumbnailUrl.includes('.png') && !thumbnailUrl.includes('.jpeg') && !thumbnailUrl.includes('.jpg')) {
    throw HTTPError(400, 'The thumbnailUrl, when fetched, is not a JPG or PNG file type');
  }

  const imageDirectoryLink = storeImage(thumbnailUrl, generator.uuid().toString());
  const link = SERVER_URL + '/' + imageDirectoryLink;

  // error checking end
  data.quizzes[quizIndex].duration = totalQuizDuration;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  const randomColours = generateRandomColourOrder();
  const answerDetails = answers.map(answer => ({
    answerId: generator.uuid(),
    answer: answer.answer,
    colour: randomColours[answerStringList.findIndex(string => string === answer.answer)],
    correct: answer.correct,
  }));
  data.quizzes[quizIndex].questions[questionIndex].question = question;
  data.quizzes[quizIndex].questions[questionIndex].duration = duration;
  data.quizzes[quizIndex].questions[questionIndex].points = points;
  data.quizzes[quizIndex].questions[questionIndex].answers = answerDetails;
  data.quizzes[quizIndex].questions[questionIndex].thumbnailUrl = link;
  setData(data);
  return {};
}

/**
 * returns the status of the quizSession of a given player
 * @param {number} playerId- playerId
 * @returns {STATE} state - state of the current quiz
 * @returns {number} numQuestions - number of questions in the quiz
 * @returns {number} at question - current question of the session
 */
export function adminPlayerGuestStatus(playerId: number) {
  const data = getData();
  const quizIndex = data.quizSessions.findIndex(quiz => quiz.players.some(player => player.playerId === playerId));
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Invalid PlayerId');
  }
  const state = data.quizSessions[quizIndex].state;
  const atQuestion = data.quizSessions[quizIndex].atQuestion;
  const numQuestions = data.quizSessions[quizIndex].metadata.numQuestions;

  return {
    state: state,
    numQuestions: numQuestions,
    atQuestion: atQuestion
  };
}

export function adminPlayerAnswerSubmit(answerIds: number[], playerId: number, questionPosition: number) {
  const data = getData();
  const sessionIndex = data.quizSessions.findIndex(session => session.players.map(player => player.playerId).includes(playerId));
  if (sessionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Player Id does not exist');
  }
  const quizInfo = data.quizSessions[sessionIndex].metadata;
  const numQuestions = quizInfo.numQuestions;
  if (questionPosition > numQuestions) {
    throw HTTPError(400, 'The question position is not valid for the session this player is in');
  }
  const sessionState = data.quizSessions[sessionIndex].state;
  if (sessionState !== STATE.QUESTION_OPEN) {
    throw HTTPError(400, 'Session is not in the QUESTION_OPEN state');
  }
  const atQuestion = data.quizSessions[sessionIndex].atQuestion;
  if (atQuestion < questionPosition) {
    throw HTTPError(400, 'The session is not yet up to this question');
  }
  if (answerIds.length === 0) {
    throw HTTPError(400, 'Less than 1 answer ID was submitted');
  }
  const validAnswerIdList = quizInfo.questions[questionPosition - 1].answers.map(answer => answer.answerId);
  let answerIdValid = true;
  for (let i = 0; i < answerIds.length; i++) {
    if (!validAnswerIdList.includes(answerIds[i])) {
      answerIdValid = false;
      break;
    }
  }
  if (answerIdValid === false) {
    throw HTTPError(400, 'Answer IDs are not valid for this particular question');
  }

  for (let i = 0; i < answerIds.length; i++) {
    for (let j = i + 1; j < answerIds.length; j++) {
      if (answerIds[i] === answerIds[j]) {
        throw HTTPError(400, 'There are duplicate answer IDs provided');
      }
    }
  }

  const playerIndex = data.quizSessions[sessionIndex].players.findIndex(player => player.playerId === playerId);
  const playerInfo = data.quizSessions[sessionIndex].players[playerIndex];
  playerInfo.answers[questionPosition - 1] = answerIds;
  const timeQuestionOpened = data.quizSessions[sessionIndex].timeQuestionLastOpened;
  playerInfo.timeTakenAnswer[questionPosition - 1] = Date.now() - timeQuestionOpened;
  const correctAnswerList = quizInfo.questions[questionPosition - 1].answers.filter(answer => answer.correct === true);
  const correctIdList = correctAnswerList.map(answer => answer.answerId).sort();
  const sortedAnswerIds = answerIds.sort();
  if (correctIdList.length !== sortedAnswerIds.length) {
    playerInfo.correct[questionPosition - 1] = false;
  } else {
    let flag = true;
    for (let i = 0; i < answerIds.length; i++) {
      if (sortedAnswerIds[i] !== correctIdList[i]) {
        flag = false;
        break;
      }
    }
    playerInfo.correct[questionPosition - 1] = flag;
  }
  setData(data);
  return {};
}

/**
 * Returns the information of whatever question the current player is on
 * @param {number} playerId - playerId
 * @param {number} questionPosition- the curent question the player is on
 * @returns {Question} question - information of player's current question
 */
export function adminPlayerCurrentQuestion(playerId: number, questionPosition: number) {
  const data = getData();
  const quizIndex = data.quizSessions.findIndex(quiz => quiz.players.some(player => player.playerId === playerId));
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Invalid PlayerId');
  }
  if (data.quizSessions[quizIndex].atQuestion !== questionPosition) {
    throw HTTPError(400, 'invalid question position for current session');
  }

  if (data.quizSessions[quizIndex].state === STATE.LOBBY || data.quizSessions[quizIndex].state === STATE.END) {
    throw HTTPError(400, 'Session must not be in Lobby or End state');
  }
  const quizData = data.quizSessions[quizIndex].metadata;

  const question = quizData.questions[questionPosition - 1];

  const answers = question.answers.map(({ answerId, answer, colour }) => ({ answerId, answer, colour }));

  return {
    questionId: question.questionId,
    question: question.question,
    duration: question.duration,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answers: answers
  };
}
/**
 * Changes the description of a quiz when given the quiz id and the user token
 * @param {string} token - session Id
 * @param {number} quizId - Id of desired quiz
 * @param {string} description - new description of quiz
 * @returns {} no return value
 */
export function adminQuizDescriptionUpdateV2(token: string, quizId: number, description: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }
  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'No quiz with quizId exists');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'User does not own this quiz');
  }
  if (description.length > 100) {
    throw HTTPError(400, 'Description is more than 100 characters long');
  }
  const timeNow = Math.floor(Date.now() / 1000);

  data.quizzes[quizIndex].description = description;
  data.quizzes[quizIndex].timeLastEdited = timeNow;
  setData(data);
  return {};
}
/**
 * returns the information of the current quizSession when given an approprotiate sessionId
 * @param {number} quizId - quizId
 * @param {number} sessionId - sessionId
 * @param {string} token - token
 * @returns {object} information of the current quiz session
 */
export function adminSessionStatus(quizId: number, sessionId: number, token: string) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Invalid quizId');
  }
  if (data.quizzes[quizIndex].ownerUserId !== data.tokens[tokenIndex].userId) {
    throw HTTPError(400, 'User is not the owner of this quiz');
  }
  const sessionIndex = data.quizSessions.findIndex(item => item.sessionId === sessionId);
  if (sessionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Invalid SessionId');
  }
  const session = data.quizSessions[sessionIndex];
  const metadata = session.metadata;
  delete metadata.ownerUserId;
  const playerNameList = session.players.map(player => player.name);
  playerNameList.sort();

  return {
    state: session.state,
    atQuestion: session.atQuestion,
    players: playerNameList,
    metadata: metadata,
  };
}

/**
 * View all user quizzes in trash
 * @param {string} token - session Id
 * @returns {object[]} - array of quizzes
 */
export function adminQuizTrashV2(token: string) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }
  const userId = data.tokens[tokenIndex].userId;
  const quizList = data.trash.filter(item => item.ownerUserId === userId);
  const quizListTrash = quizList.map(quiz => ({
    quizId: quiz.quizId,
    name: quiz.name,
  }));
  return { quizzes: quizListTrash };
}

/**
 * Allows a guest player to join a session of a quiz
 * @param {number} playerid - sessionId of the session
 * @param {message: {messageBody: string}} message - name of player that is joining
 * @returns {{}} - empty object
 */
export function adminQuizSessionSendMessage (playerId: number, message: message) {
  const data = getData();

  if (message.messageBody.length < 1 || message.messageBody.length > 100) {
    throw HTTPError(400, 'message body is less than 1 character or more than 100 characters');
  }

  let playerSession: number;
  let playerName: string;
  let playerExists = false;
  for (const session of data.quizSessions) {
    for (const player of session.players) {
      if (player.playerId === playerId) {
        playerSession = session.sessionId;
        playerName = player.name;
        playerExists = true;
        break;
      }
    }
  }

  if (!playerExists) {
    throw HTTPError(400, 'playerID does not exist');
  }

  const sessionIndex = data.quizSessions.findIndex(session => session.sessionId === playerSession);

  data.quizSessions[sessionIndex].messages.push({
    messageBody: message.messageBody,
    playerId: playerId,
    playerName: playerName,
    timeSent: Math.floor(Date.now() / 1000),
  });

  setData(data);
  return {};
}

export function adminQuestionResults(playerId: number, questionPosition: number) {
  const data = getData();
  const quizSession = data.quizSessions.find(item => item.players.map(player => player.playerId).includes(playerId));
  if (!quizSession) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  const quiz = quizSession.metadata;
  const numQuestions = quiz.numQuestions;

  if (questionPosition > numQuestions) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  const sessionState = quizSession.state;
  if (sessionState !== STATE.ANSWER_SHOW) {
    throw HTTPError(400, 'Session is not in ANSWER_SHOW state');
  }

  const atQuestion = quizSession.atQuestion;
  if (atQuestion < questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }

  // get question
  const questionIndex = questionPosition - 1;
  const question = quiz.questions[questionIndex];

  // questionCorrectBreakdown
  const correctAnswerIds = question.answers
    . filter(answer => answer.correct === true)
    . map(answer => answer.answerId);

  // Calculate questionCorrectBreakdown
  const questionCorrectBreakdown = correctAnswerIds.map(answerId => {
    const playersCorrect = quizSession.players
      .filter(player => player.answers[questionIndex].includes(answerId))
      .map(player => player.name);
    return {
      answerId: answerId,
      playersCorrect: playersCorrect
    };
  });
    // find correct answer for current question

  const totalPlayers = quizSession.players.length;
  const timeTakenAnswer = quizSession.players.map(player => player.timeTakenAnswer[questionIndex]);

  // sum array of timeTakenAnswer for specific question
  const totalAnswerTime = timeTakenAnswer.reduce((sum, time) => sum + time, 0);
  const averageAnswerTime = totalAnswerTime / (totalPlayers * 1000);

  // percent correct
  const playersCorrectPercentage : string[] = [];
  quizSession.players.forEach(player => {
    if (player.correct[questionIndex] === true) {
      playersCorrectPercentage.push(player.name);
    }
  });

  const numPlayersCorrect = playersCorrectPercentage.length;
  const percentCorrect = (numPlayersCorrect / totalPlayers) * 100;

  const questionResult = {
    questionId: question.questionId,
    questionCorrectBreakdown: questionCorrectBreakdown,
    averageAnswerTime: averageAnswerTime,
    percentCorrect: percentCorrect
  };
  setData(data);
  return questionResult;
}

/**
 * views all messages for a quiz session that a current player is in
 * @param {number} playerid - sessionId of the session
 * @param {message: {messageBody: string}} message - name of player that is joining
 * @returns {message[]} - array of all messages sent in current session
 */
export function adminViewSessionMessages(playerId: number) {
  const data = getData();
  const quizIndex = data.quizSessions.findIndex(quiz => quiz.players.some(player => player.playerId === playerId));
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Invalid PlayerId');
  }
  const messages = data.quizSessions[quizIndex].messages;
  return {
    messages: messages
  };
}

/**
 * updates the thumbnail image of a quiz
 * @param {number} quizId - quiz Id of quiz
 * @param {string} token - token of user
 * @param {string} imgUrl - new thumbnail link
 * @returns {} - empty object
 */
export function adminQuizThumbnailUpdate(quizId: number, token: string, thumbnailUrl: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'No quiz with quizId exists');
  }
  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'User does not own this quiz');
  }
  if (!thumbnailUrl.includes('.png') && !thumbnailUrl.includes('.jpg') && !thumbnailUrl.includes('.jpeg')) {
    throw HTTPError(400, 'The thumbnailUrl is not a jpg or png file type');
  }

  const imageDirectoryLink = storeImage(thumbnailUrl, generator.uuid().toString());
  const link = SERVER_URL + '/' + imageDirectoryLink;

  data.quizzes[quizIndex].thumbnailUrl = link;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return {};
}

/**
 * creates an array of all active and inactive sessions for a given quiz
 * @param {number} quizId - quizid
 * @param {string} token - Token for a given player session
 * @returns {number[]} activeSessions - all sessions for a given quiz that are still running
 * @returns {number[]} inactiveSessions - all sessions for a given quiz that are not still running
 */
export function adminViewQuizSessions(token: string, quizId: number) {
  const data = getData();
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Invalid quizId');
  }

  let activeSessions: number[] = [];
  let inactiveSessions: number[] = [];
  for (const session of data.quizSessions) {
    if (session.metadata.quizId === quizId) {
      if (session.state === STATE.END) {
        inactiveSessions.push(session.sessionId);
      } else {
        activeSessions.push(session.sessionId);
      }
    }
  }
  activeSessions = activeSessions.sort((a, b) => a - b);
  inactiveSessions = inactiveSessions.sort((a, b) => a - b);

  return {
    activeSessions: activeSessions,
    inactiveSessions: inactiveSessions
  };
}

/**
 * Get the final results for all players for a completed quiz session
 * @param {number} quizId
 * @param {number} sessionId
 * @param {string} token
 * @returns {object} { usersRankedByScore: { object[] }, questionResults: { object[] }
 */
export function adminSessionFinalResults(quizId: number, sessionId: number, token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }

  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const sessionIndex = data.quizSessions.findIndex(item => item.sessionId === sessionId);
  if (sessionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Session Id does not refer to a valid question within this quiz');
  }
  if (data.quizSessions[sessionIndex].state !== STATE.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in final state');
  }
  const session = data.quizSessions[sessionIndex];

  const usersRankedByScore = session.players.map(player => {
    let score = 0;
    player.answers.forEach((answersForQuestion, questionIndex) => {
      const question = session.metadata.questions[questionIndex];
      const correctAnswerIds = question.answers.filter(answer => answer.correct).map(answer => answer.answerId);

      if (answersForQuestion.every(answerId => correctAnswerIds.includes(answerId)) && answersForQuestion.length === correctAnswerIds.length) {
        const correctOrder = session.players
          .filter(p => p.answers[questionIndex].every(answerId => correctAnswerIds.includes(answerId)) && p.answers[questionIndex].length === correctAnswerIds.length)
          .sort((a, b) => a.timeTakenAnswer[questionIndex] - b.timeTakenAnswer[questionIndex]);

        const rank = correctOrder.findIndex(p => p.playerId === player.playerId);
        score += Math.round((question.points / (rank + 1)) * 10) / 10;
      }
    });

    return {
      name: player.name,
      score: Math.round(score * 10) / 10,
    };
  }).sort((a, b) => b.score - a.score);

  const questionResults = session.metadata.questions.map((question, index) => {
    const questionCorrectBreakdown = question.answers.map(answer => {
      if (answer.correct) {
        return {
          answerId: answer.answerId,
          playersCorrect: session.players.filter(player => player.answers[index].includes(answer.answerId)).map(player => player.name),
        };
      }
      return null;
    }).filter(answer => answer !== null);
    const averageAnswerTime = Math.round((session.players.reduce((total, player) => total + player.timeTakenAnswer[index], 0) / session.players.length / 1000) * 10) / 10;
    const percentCorrect = Math.round((session.players.reduce((total, player) => total + (player.correct[index] ? 1 : 0), 0) / session.players.length * 100) * 10) / 10;
    return {
      questionId: question.questionId,
      questionCorrectBreakdown,
      averageAnswerTime,
      percentCorrect,
    };
  });
  return { usersRankedByScore, questionResults };
}

export function adminSessionResults(playerId : number) {
  const data = getData();

  const quizSession = data.quizSessions.find(item => item.players.map(player => player.playerId).includes(playerId));
  if (!quizSession) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  const sessionState = quizSession.state;
  if (sessionState !== STATE.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  const sessionIndex = data.quizSessions.findIndex(item => item.sessionId === quizSession.sessionId);
  const session = data.quizSessions[sessionIndex];

  const usersRankedByScore = session.players.map(player => {
    let score = 0;
    player.answers.forEach((answersForQuestion, questionIndex) => {
      const question = session.metadata.questions[questionIndex];
      const correctAnswerIds = question.answers.filter(answer => answer.correct).map(answer => answer.answerId);

      if (answersForQuestion.every(answerId => correctAnswerIds.includes(answerId)) && answersForQuestion.length === correctAnswerIds.length) {
        const correctOrder = session.players
          .filter(p => p.answers[questionIndex].every(answerId => correctAnswerIds.includes(answerId)) && p.answers[questionIndex].length === correctAnswerIds.length)
          .sort((a, b) => a.timeTakenAnswer[questionIndex] - b.timeTakenAnswer[questionIndex]);

        const rank = correctOrder.findIndex(p => p.playerId === player.playerId);
        score += Math.round((question.points / (rank + 1)) * 10) / 10;
      }
    });

    return {
      name: player.name,
      score: Math.round(score * 10) / 10,
    };
  }).sort((a, b) => b.score - a.score);

  const questionResults = session.metadata.questions.map((question, index) => {
    const questionCorrectBreakdown = question.answers.map(answer => {
      if (answer.correct) {
        return {
          answerId: answer.answerId,
          playersCorrect: session.players.filter(player => player.answers[index].includes(answer.answerId)).map(player => player.name),
        };
      }
      return null;
    }).filter(answer => answer !== null);
    const averageAnswerTime = Math.round((session.players.reduce((total, player) => total + player.timeTakenAnswer[index], 0) / session.players.length / 1000) * 10) / 10;
    const percentCorrect = Math.round((session.players.reduce((total, player) => total + (player.correct[index] ? 1 : 0), 0) / session.players.length * 100) * 10) / 10;
    return {
      questionId: question.questionId,
      questionCorrectBreakdown,
      averageAnswerTime,
      percentCorrect,
    };
  });
  return { usersRankedByScore, questionResults };
}

/**
 * Get the final results for all players for a completed quiz session in CSV format
 * @param {number} quizId
 * @param {number} sessionId
 * @param {string} token
 * @returns {object} { URL: string }
 */
export function adminSessionFinalResultsCSV(quizId: number, sessionId: number, token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }

  const userId = data.tokens[tokenIndex].userId;
  const quizIndex = data.quizzes.findIndex(item => item.quizId === quizId);
  if (quizIndex === NOT_FOUND) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz');
  }

  if (data.quizzes[quizIndex].ownerUserId !== userId) {
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const sessionIndex = data.quizSessions.findIndex(item => item.sessionId === sessionId);
  if (sessionIndex === NOT_FOUND) {
    throw HTTPError(400, 'Session Id does not refer to a valid question within this quiz');
  }
  if (data.quizSessions[sessionIndex].state !== STATE.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in final state');
  }

  const session = data.quizSessions[sessionIndex];
  const players = session.players.map(player => ({
    name: player.name,
    answers: player.answers,
    timeTakenAnswer: player.timeTakenAnswer,
  })).sort((a, b) => a.name.localeCompare(b.name));

  const numberOfQuestions = session.metadata.questions.length;
  const headers = ['Player'];
  for (let i = 1; i <= numberOfQuestions; i++) {
    headers.push(`question${i}score`, `question${i}rank`);
  }
  const csvRows = players.map(() => []);
  const scoresPerQuestion = Array.from({ length: numberOfQuestions }, () => []);

  players.forEach((player, playerIndex) => {
    csvRows[playerIndex].push(player.name);

    player.answers.forEach((answersForQuestion, questionIndex) => {
      const question = session.metadata.questions[questionIndex];
      const correctAnswerIds = question.answers.filter(answer => answer.correct).map(answer => answer.answerId);

      const correctPlayers = players.filter(p =>
        p.answers[questionIndex].every(answerId => correctAnswerIds.includes(answerId)) &&
        p.answers[questionIndex].length === correctAnswerIds.length
      );

      correctPlayers.sort((a, b) => a.timeTakenAnswer[questionIndex] - b.timeTakenAnswer[questionIndex]);

      let score = 0;
      if (answersForQuestion.every(answerId => correctAnswerIds.includes(answerId)) && answersForQuestion.length === correctAnswerIds.length) {
        const rank = correctPlayers.findIndex(p => p.name === player.name) + 1;
        score = parseFloat((question.points / rank).toFixed(1));
      }

      scoresPerQuestion[questionIndex].push(score);
    });
  });

  players.forEach((player, playerIndex) => {
    scoresPerQuestion.forEach((scoresForQuestion, questionIndex) => {
      const sortedScores = [...scoresForQuestion].sort((a, b) => b - a);
      const rank = sortedScores.indexOf(scoresForQuestion[playerIndex]) + 1;
      csvRows[playerIndex].push(scoresForQuestion[playerIndex], rank); // Removed the headers here
    });
  });

  const csvString = [headers, ...csvRows].map(row => row.join(',')).join('\n');
  const fileName = `session_${sessionId}.csv`;
  const directoryPath = path.join(__dirname, '..', 'csv_files');
  const filePath = path.join(directoryPath, fileName);

  fs.writeFileSync(filePath, csvString);
  const url = `${SERVER_URL}/csv_files/${fileName}`;
  return { url };
}

// ========================================================================
//  ================= HELPER FUNCTION BELOW THIS LINE ===================
// ========================================================================

/**
 * checks if a new Quiz name is unique or not
 * @param {string}name of the new quiz
 * @returns {boolean} - status of quiz Id uniqueness
 */
function nameUniquenessCheck(name: string, id: number) {
  const data = getData();
  for (const quiz of data.quizzes) {
    if ((quiz.name === name) && (quiz.ownerUserId === id)) {
      return false;
    }
  }
  for (const quiz of data.trash) {
    if ((quiz.name === name) && (quiz.ownerUserId === id)) {
      return false;
    }
  }
  return true;
}

/**
 * Generates a random colour order for the question answers
 * @param {} no input
 * @returns {string[]} - array of colours
 */
function generateRandomColourOrder() {
  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'brown', 'orange'];
  const randomColours = [];
  while (colours.length > 0) {
    const randomNumber = Math.floor(Math.random() * colours.length);
    randomColours.push(colours[randomNumber]);
    colours.splice(randomNumber, 1);
  }
  return randomColours;
}

/**
 * Generates a random name for player joining session
 * @param {} no input
 * @returns {string} - name of player
 */
function generateRandomName() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const numbers = '1234567890'.split('');
  let name = '';
  while (name.length < 5) {
    const randomNumber = Math.floor(Math.random() * letters.length);
    name = name + letters[randomNumber];
    letters.splice(randomNumber, 1);
  }
  while (name.length < 8) {
    const randomNumber = Math.floor(Math.random() * numbers.length);
    name = name + numbers[randomNumber];
    numbers.splice(randomNumber, 1);
  }
  return name;
}

export function storeImage(URL: string, fileName: string) {
  let fileType;
  if (URL.includes('.png')) {
    fileType = 'png';
  } else {
    fileType = 'jpg';
  }
  try {
    const res = request('GET', URL);
    const body = res.getBody();
    fs.writeFileSync('images/' + fileName + '.' + fileType, body, { flag: 'w' });
  } catch (err) {
    throw HTTPError(400, 'Url does not return to a valid file');
  }
  return ('images/' + fileName + '.' + fileType);
}
