import {
  getData,
  setData
} from './dataStore';
import { port, url } from './config.json';
const SERVER_URL = `${url}:${port}`;
import HTTPError from 'http-errors';
import UUID from 'uuid-int';
const id = 0;
const generator = UUID(id);
const NOT_FOUND = -1;

type inputAnswer = {
  answer: string;
  correct: boolean;
}

// ========================================================================
//  ==================== ITERATION 2 BELOW THIS LINE =====================
// ========================================================================

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
export function adminQuizInfoV1(token: string, quizId: number) {
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
      questions: data.quizzes[quizIndex].questions.map(question => ({
        questionId: question.questionId,
        question: question.question,
        duration: question.duration,
        points: question.points,
        answers: question.answers
      })),
      duration: data.quizzes[quizIndex].duration,
    };
  }
}

/**
 * Given details about the question and a valid token, create a question in the quiz with the input quizId.
 * @param {number} quizId - Id of quiz
 * @param {string} token - token of current user session
 * @param {string} question - the question string
 * @param {number} duration - length that question is displayed in seconds
 * @param {number} points - number of points for getting question correct
 * @param {inputAnswer} answers - object containing possible answers and whether they are correct
 * @returns {questionId: number} - id of question
 */
export function adminQuestionCreateV1(quizId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[]) {
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
    thumbnailUrl: SERVER_URL + '/images/default.png'
  };
  data.quizzes[quizIndex].questions.push(questionDetails);
  setData(data);
  return { questionId: generatedQuestionId };
}

/**
 * Update the relevant details of a particular question within a quiz.
 * When this route is called, the timeLastEdited is updated, and the colours of a question are randomly generated.
 * @param {number} quizId - quiz Id
 * @param {number} questionId - question Id
 * @param {string} token - token of user session
 * @param {string} question - question
 * @param {number} duration - duration of question
 * @param {number} points - points of question
 * @param {inputAnswer} answers - object containing possible answers and whether they are correct
 * @returns {questionId: number} - id of question
 * @returns {} - empty object if successful
 */
export function adminQuestionUpdateV1(quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[]) {
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
  const questionIndex = data.quizzes[quizIndex].questions.findIndex(item => item.questionId === questionId);
  if (questionIndex === NOT_FOUND) {
    throw HTTPError(400, 'No question with questionId exists');
  }
  // error checking
  if (question.length < 5 || question.length > 50) {
    throw HTTPError(400, 'Question string is too short/long');
  }
  if (answers.length < 2 || answers.length > 6) {
    throw HTTPError(400, 'Too many/less answers');
  }
  if (duration <= 0) {
    throw HTTPError(400, 'Duration is not a positive number or is zero');
  }
  let totalQuizDuration = data.quizzes[quizIndex].duration;
  totalQuizDuration -= data.quizzes[quizIndex].questions[questionIndex].duration;
  totalQuizDuration += duration;

  if (totalQuizDuration > 180) {
    throw HTTPError(400, 'Duration of the quiz cannot exceed 3 minutes');
  }
  if (points < 1 || points > 10) {
    throw HTTPError(400, 'Too many/less points');
  }
  // check if answers are valid, no duplicate answers, and exactly one correct answer and length of answer is valid
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
  data.quizzes[quizIndex].duration = totalQuizDuration;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  const thumbnailUrl = data.quizzes[quizIndex].thumbnailUrl;

  const randomColours = generateRandomColourOrder();
  const answerDetails = answers.map(answer => ({
    answerId: generator.uuid(),
    answer: answer.answer,
    colour: randomColours[answerStringList.findIndex(string => string === answer.answer)],
    correct: answer.correct,
  }));

  const questionDetails = {
    questionId: questionId,
    question: question,
    duration: duration,
    points: points,
    answers: answerDetails,
    thumbnailUrl: thumbnailUrl
  };
  data.quizzes[quizIndex].questions[questionIndex] = questionDetails;
  setData(data);
  return {};
}

// ========================================================================
//  ================= HELPER FUNCTION BELOW THIS LINE ===================
// ========================================================================
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
