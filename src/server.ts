import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { clear } from './other';

import { adminAuthRegisterV1, adminAuthLoginV1 } from './auth';

import { adminAuthLogoutV2, adminUserDetailsUpdateV2, adminUserPasswordUpdateV2, adminUserDetailsV2 } from './iter3Auth';
import {
  adminQuizInfoV1,
  adminQuestionCreateV1,
  adminQuestionUpdateV1,
} from './quiz';
import {
  adminQuizRestoreV2, adminMoveQuestionV2, adminQuizInfoV2,
  adminQuizCreateV2, adminQuestionCreateV2, adminQuestionDuplicateV2,
  adminQuizNameUpdateV2, adminQuizNewSession, adminUpdateSessionState,
  adminPlayerJoin, adminQuizRemoveV2, adminTrashEmptyV2, adminQuizThumbnailUpdate,
  adminOwnerTransferV2, adminQuizDescriptionUpdateV2, adminPlayerGuestStatus,
  adminPlayerCurrentQuestion, adminPlayerAnswerSubmit, adminQuizTrashV2,
  adminQuestionUpdateV2, adminSessionStatus, adminQuizSessionSendMessage,
  adminViewSessionMessages, adminViewQuizSessions, adminQuizListV2, adminQuestionDeleteV2,
  adminQuestionResults, adminSessionFinalResults, adminSessionResults,
  adminSessionFinalResultsCSV
} from './iter3Quiz';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for producing the docs that define the API
const file = fs.readFileSync('./swagger.yaml', 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

app.use('/images', express.static('images'));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// for logging errors (print to terminal)
app.use(morgan('dev'));

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

app.delete('/v1/clear', (req: Request, res: Response) => {
  const response = clear();
  res.json(response);
});

app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  const response = adminAuthRegisterV1(email, password, nameFirst, nameLast);
  res.json(response);
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const response = adminAuthLoginV1(email, password);
  res.json(response);
});

app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const { token } = req.body;
  const response = adminAuthLogoutV2(token);
  res.json(response);
});

app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminUserDetailsV2(token);
  res.json(response);
});

app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;
  const response = adminUserDetailsUpdateV2(token, email, nameFirst, nameLast);
  res.json(response);
});

app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const response = adminUserPasswordUpdateV2(token, oldPassword, newPassword);
  res.json(response);
});

app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const { token, name, description } = req.body;
  const response = adminQuizCreateV2(token, name, description);
  res.json(response);
});

app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminQuizTrashV2(token);
  res.json(response);
});

app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminQuizListV2(token);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.query.token as string;
  const response = adminQuizInfoV1(token, quizId);
  res.json(response);
});

app.delete('/v1/admin/quiz/:quizid', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response = adminQuizRemoveV2(token, quizId);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, name } = req.body;
  const response = adminQuizNameUpdateV2(token, quizId, name);
  res.json(response);
});

app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizIds = (req.query.quizIds as string);
  const response = adminTrashEmptyV2(token, quizIds);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, description } = req.body;
  const response = adminQuizDescriptionUpdateV2(token, quizId, description);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, questionBody } = req.body;
  const { question, duration, points, answers } = questionBody;
  const response = adminQuestionCreateV1(quizId, token, question, duration, points, answers);
  res.json(response);
});

app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.query.token as string;

  const response = adminQuestionDeleteV2(quizId, questionId, token);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const { token, newPosition } = req.body;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const response = adminMoveQuestionV2(quizId, questionId, token, newPosition);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { token } = req.body;
  const response = adminQuestionDuplicateV2(quizId, questionId, token);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token } = req.body;
  const response = adminQuizRestoreV2(quizId, token);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizId/transfer', (req: Request, res: Response) => {
  const { token, userEmail } = req.body;
  const quizId = parseInt(req.params.quizId);
  const response = adminOwnerTransferV2(token, quizId, userEmail);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { token, questionBody } = req.body;
  const { question, duration, points, answers } = questionBody;
  const response = adminQuestionUpdateV1(quizId, questionId, token, question, duration, points, answers);
  res.json(response);
});

/// /////////////////////////////// Iteration 3 routes ///////////////////////////////////////

app.use('/csv_files', express.static(path.join(__dirname, '..', 'csv_files')));

app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminQuizListV2(token);
  res.json(response);
});

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminAuthLogoutV2(token);
  res.json(response);
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminUserDetailsV2(token);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizId/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const token = req.headers.token as string;
  const email = req.body.userEmail as string;
  const response = adminOwnerTransferV2(token, quizId, email);
  res.json(response);
});

app.post('/v1/player/join', (req: Request, res: Response) => {
  const { sessionId, name } = req.body;
  const response = adminPlayerJoin(sessionId, name);
  res.json(response);
});

app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const { email, nameFirst, nameLast } = req.body;
  const token = req.headers.token as string;
  const response = adminUserDetailsUpdateV2(token, email, nameFirst, nameLast);
  res.json(response);
});

app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers.token as string;
  const response = adminUserPasswordUpdateV2(token, oldPassword, newPassword);
  res.json(response);
});
app.post('/v2/admin/quiz', (req:Request, res: Response) => {
  const token = req.headers.token as string;
  const { name, description } = req.body;
  const response = adminQuizCreateV2(token, name, description);
  res.json(response);
});

app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminQuizTrashV2(token);
  res.json(response);
});

app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response = adminQuizInfoV2(token, quizId);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { name } = req.body;
  const token = req.headers.token as string;
  const response = adminQuizNameUpdateV2(token, quizId, name);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { questionBody } = req.body;
  const token = req.headers.token as string;
  const { question, duration, points, answers, thumbnailUrl } = questionBody;
  const response = adminQuestionCreateV2(quizId, token, question, duration, points, answers, thumbnailUrl);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response = adminQuizRestoreV2(quizId, token);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { newPosition } = req.body;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const response = adminMoveQuestionV2(quizId, questionId, token, newPosition);
  res.json(response);
});

app.delete('/v2/admin/quiz/:quizId', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizId);
  const response = adminQuizRemoveV2(token, quizId);
  res.json(response);
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizIds = (req.query.quizids as string);
  const response = adminTrashEmptyV2(token, quizIds);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { description } = req.body;
  const token = req.headers.token as string;
  const response = adminQuizDescriptionUpdateV2(token, quizId, description);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { imgUrl } = req.body;
  const token = req.headers.token as string;
  const response = adminQuizThumbnailUpdate(quizId, token, imgUrl);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;
  const response = adminQuestionDuplicateV2(quizId, questionId, token);
  res.json(response);
});

app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;
  const response = adminQuestionDeleteV2(quizId, questionId, token);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const { autoStartNum } = req.body;
  const response = adminQuizNewSession(quizId, token, autoStartNum);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token = req.headers.token as string;
  const { action } = req.body;
  const response = adminUpdateSessionState(quizId, sessionId, token, action);
  res.json(response);
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const { answerIds } = req.body;
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const response = adminPlayerAnswerSubmit(answerIds, playerId, questionPosition);
  res.json(response);
});

app.get('/v1/player/:playerId', (req:Request, res: Response) => {
  const playerId = parseInt(req.params.playerId);
  const response = adminPlayerGuestStatus(playerId);
  res.json(response);
});

app.get('/v1/player/:playerId/question/:questionposition', (req:Request, res: Response) => {
  const playerId = parseInt(req.params.playerId);
  const questionPosition = parseInt(req.params.questionposition);
  const response = adminPlayerCurrentQuestion(playerId, questionPosition);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizId/session/:sessionId', (req:Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const sessionId = parseInt(req.params.sessionId);
  const token = req.headers.token as string;
  const response = adminSessionStatus(quizId, sessionId, token);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;
  const { questionBody } = req.body;
  const { question, duration, points, answers, thumbnailUrl } = questionBody;
  const response = adminQuestionUpdateV2(quizId, questionId, token, question, duration, points, answers, thumbnailUrl);
  res.json(response);
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const response = adminViewSessionMessages(playerId);
  res.json(response);
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const { message } = req.body;
  const playerId = parseInt(req.params.playerid);
  const response = adminQuizSessionSendMessage(playerId, message);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizId/sessions', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizId);
  const response = adminViewQuizSessions(token, quizId);
  res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const response = adminQuestionResults(playerId, questionPosition);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token = req.headers.token as string;
  const response = adminSessionFinalResults(quizId, sessionId, token);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizId/session/:sessionId/results/csv', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const sessionId = parseInt(req.params.sessionId);
  const token = req.headers.token as string;
  const response = adminSessionFinalResultsCSV(quizId, sessionId, token);
  res.json(response);
});

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const response = adminSessionResults(playerId);
  res.json(response);
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
