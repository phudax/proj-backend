import request from 'sync-request';
import { port, url } from './config.json';
import { COMMANDS } from './dataStore';
const SERVER_URL = `${url}:${port}`;

interface inputAnswer {
  answer: string;
  correct: boolean;
}

export type message = {
  messageBody: string;
}

export const requestAuthLogoutV2 = (token: string) => {
  const res = request('POST', SERVER_URL + '/v2/admin/auth/logout', { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizThumbnailUpdate = (quizId: number, token: string, imgUrl: string) => {
  const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/thumbnail`, { json: { imgUrl }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestOwnerTransferV2 = (token: string, userEmail: string, quizId: number) => {
  const res = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, { headers: { token }, json: { userEmail } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizCreateV2 = (token: string, name: string, description: string) => {
  const res = request('POST', SERVER_URL + '/v2/admin/quiz', { headers: { token }, json: { name, description } });

  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizRestoreV2 = (quizid: number, token: string) => {
  const res = request('POST', SERVER_URL + `/v2/admin/quiz/${quizid}/restore`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestMoveQuestionV2 = (quizId: number, questionId: number, token: string, newPosition: number) => {
  const res = request('PUT', SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}/move`, { json: { newPosition }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestTrashEmptyV2 = (token: string, quizIds: string) => {
  const res = request('DELETE', SERVER_URL + `/v2/admin/quiz/trash/empty/?quizids=${quizIds}`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizRemoveV2 = (token: string, quizId: number) => {
  const res = request('DELETE', SERVER_URL + `/v2/admin/quiz/${quizId}`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizNameUpdateV2 = (token: string, quizId: number, name: string) => {
  const res = request('PUT', SERVER_URL + `/v2/admin/quiz/${quizId}/name`, { json: { name }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestUserDetailsV2 = (token: string) => {
  const res = request('GET', SERVER_URL + '/v2/admin/user/details', { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestUserDetailsUpdateV2 = (token: string, email: string, nameFirst: string, nameLast: string) => {
  const res = request('PUT', SERVER_URL + '/v2/admin/user/details', { json: { email, nameFirst, nameLast }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestUserPasswordUpdateV2 = (token: string, oldPassword: string, newPassword: string) => {
  const res = request('PUT', SERVER_URL + '/v2/admin/user/password', { json: { oldPassword, newPassword }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizListV2 = (token: string) => {
  const res = request('GET', SERVER_URL + '/v2/admin/quiz/list', { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizInfoV2 = (token: string, quizId: number) => {
  const res = request('GET', SERVER_URL + `/v2/admin/quiz/${quizId}`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionCreateV2 = (quizId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[], thumbnailUrl: string) => {
  const questionBody = {
    question: question,
    duration: duration,
    points: points,
    answers: answers,
    thumbnailUrl: thumbnailUrl
  };
  const res = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/question`, { json: { questionBody }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionDuplicateV2 = (quizId: number, questionId: number, token: string) => {
  const res = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}/duplicate`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionDeleteV2 = (quizId: number, questionId: number, token: string) => {
  const res = request('DELETE', SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};
export const requestQuizStartSession = (quizId: number, token: string, autoStartNum: number) => {
  const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/session/start`, { json: { autoStartNum }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizSessionUpdateState = (quizId: number, sessionId: number, token: string, action: string | COMMANDS) => {
  const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/session/${sessionId}`, { json: { action }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestPlayerJoin = (sessionId: number, name: string) => {
  const res = request('POST', SERVER_URL + '/v1/player/join', { json: { sessionId, name } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestPlayerAnswerSubmit = (answerIds: number[], playerId: number, questionPosition: number) => {
  const res = request('PUT', SERVER_URL + `/v1/player/${playerId}/question/${questionPosition}/answer`, { json: { answerIds } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizDescriptionUpdateV2 = (token: string, quizId: number, description: string) => {
  const res = request('PUT', SERVER_URL + `/v2/admin/quiz/${quizId}/description`, { json: { description }, headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionUpdateV2 = (quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[], thumbnailUrl: string) => {
  const questionBody = {
    question: question,
    duration: duration,
    points: points,
    answers: answers,
    thumbnailUrl: thumbnailUrl
  };
  const res = request('PUT', SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}`, { headers: { token }, json: { questionBody } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestGuestStatus = (playerId: number) => {
  const res = request('GET', SERVER_URL + `/v1/player/${playerId}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestPlayerCurrentQuestion = (playerId: number, questionposition: number) => {
  const res = request('GET', SERVER_URL + `/v1/player/${playerId}/question/${questionposition}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizTrashV2 = (token: string) => {
  const res = request('GET', SERVER_URL + '/v2/admin/quiz/trash', { headers: { token } });

  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestSessionMessages = (playerid: number) => {
  const res = request('GET', SERVER_URL + `/v1/player/${playerid}/chat`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestSessionStatus = (quizId: number, sessionId: number, token: string) => {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/session/${sessionId}`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizSessionSendMessage = (playerId: number, message: message) => {
  const res = request('POST', SERVER_URL + `/v1/player/${playerId}/chat`, { json: { message } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizSessions = (token: string, quizId: number) => {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/sessions`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionResults = (playerId: number, questionPosition: number) => {
  const res = request('GET', SERVER_URL + `/v1/player/${playerId}/question/${questionPosition}/results`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestSessionFinalResultsCSV = (quizId: number, sessionId: number, token: string) => {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestSessionFinalResults = (quizId: number, sessionId: number, token: string) => {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestSessionResults = (playerId: number) => {
  const res = request('GET', SERVER_URL + `/v1/player/${playerId}/results`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};
