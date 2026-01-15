import request from 'sync-request';
import { port, url } from './config.json';
const SERVER_URL = `${url}:${port}`;

interface inputAnswer {
  answer: string;
  correct: boolean;
}

export const requestClear = () => {
  const res = request('DELETE', SERVER_URL + '/v1/clear', {});
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string) => {
  const res = request('POST', SERVER_URL + '/v1/admin/auth/register', { json: { email, password, nameFirst, nameLast } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestAuthLogin = (email: string, password: string) => {
  const res = request('POST', SERVER_URL + '/v1/admin/auth/login', { json: { email, password } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestUserDetails = (token: string) => {
  const res = request('GET', SERVER_URL + `/v1/admin/user/details?token=${token}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestAuthLogout = (token: string) => {
  const res = request('POST', SERVER_URL + '/v1/admin/auth/logout', { json: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestUserPasswordUpdate = (token: string, oldPassword: string, newPassword: string) => {
  const res = request('PUT', SERVER_URL + '/v1/admin/user/password', { json: { token, oldPassword, newPassword } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizCreate = (token: string, name: string, description: string) => {
  const res = request('POST', SERVER_URL + '/v1/admin/quiz', { json: { token, name, description } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizList = (token: string) => {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/list?token=${token}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizRemove = (token: string, quizId: number) => {
  const res = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}`, { headers: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizInfo = (token: string, quizId: number) => {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}?token=${token}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizNameUpdate = (token: string, quizId: number, name: string) => {
  const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/name`, { json: { token, name } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestUserDetailsUpdate = (token: string, email: string, nameFirst: string, nameLast: string) => {
  const res = request('PUT', SERVER_URL + '/v1/admin/user/details', { json: { token, email, nameFirst, nameLast } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionCreate = (quizId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[]) => {
  const questionBody = {
    question: question,
    duration: duration,
    points: points,
    answers: answers
  };
  const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, { json: { token, questionBody } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionDuplicate = (quizId: number, questionId: number, token: string) => {
  const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}/duplicate`, { json: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestMoveQuestion = (quizId: number, questionId: number, token: string, newPosition: number) => {
  const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}/move`, { json: { token, newPosition } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizDescriptionUpdate = (token: string, quizId: number, description: string) => {
  const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, { json: { token, description } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestOwnerTransfer = (token: string, userEmail: string, quizId: number) => {
  const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, { json: { token, userEmail } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestTrashEmpty = (token: string, quizIds: string) => {
  const res = request('DELETE', SERVER_URL + `/v1/admin/quiz/trash/empty/?token=${token}&quizIds=${quizIds}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionDelete = (quizId: number, questionId: number, token: string) => {
  const res = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}?token=${token}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizListTrash = (token: string) => {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/trash?token=${token}`);
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuizRestore = (quizid: number, token: string) => {
  const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizid}/restore`, { json: { token } });
  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};

export const requestQuestionUpdate = (quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: inputAnswer[]) => {
  const questionBody = {
    question: question,
    duration: duration,
    points: points,
    answers: answers
  };
  const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, { json: { token, questionBody } });

  return {
    retValue: JSON.parse(res.body.toString()),
    statusCode: res.statusCode
  };
};
