import validator from 'validator';
import { getData, setData } from './dataStore';
import UUID from 'uuid-int';
import { getHashOf } from './iter3Auth';
import HTTPError from 'http-errors';

const id = 0;
const generator = UUID(id);
const NOT_FOUND = -1;
const min = 1;
const max = 10000;

/**
 * registers a user that can make quizzes
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {{token: string}} - returns unique token, a login session
 */
export function adminAuthRegisterV1(email: string, password: string, nameFirst: string, nameLast: string) {
  const data = getData();

  const userList = (data.users).map(user => user.email);

  if (userList.includes(email)) {
    throw HTTPError(400, 'email is already in use');
  } else if (!validator.isEmail(email)) {
    throw HTTPError(400, 'invalid email');
  } else if (!/^[A-Za-z \-']+$/.test(nameFirst)) {
    throw HTTPError(400, 'disallowed characters in nameFirst');
  } else if (nameFirst.length < 2 || nameFirst.length > 20) {
    throw HTTPError(400, 'nameFirst too short/long');
  } else if (!/^[A-Za-z \-']+$/.test(nameLast)) {
    throw HTTPError(400, 'disallowed characters in nameLast');
  } else if (nameLast.length < 2 || nameLast.length > 20) {
    throw HTTPError(400, 'nameLast too short/long');
  } else if (password.length < 8) {
    throw HTTPError(400, 'password too short');
  } else if (!/[0-9].*[a-zA-Z]|[a-zA-Z].*[0-9]/.test(password)) {
    throw HTTPError(400, 'password no letter or number');
  }

  const newUserId = generator.uuid();
  const newSessionId = getRandomNum();
  const newUser = {
    userId: newUserId,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    password: getHashOf(password),
    guestStatus: false,
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    prevPasswords: [password],
  };

  const newToken = {
    userId: newUserId,
    sessionId: newSessionId.toString(),
  };

  data.users.push(newUser);
  data.tokens.push(newToken);
  setData(data);

  return {
    token: newSessionId.toString(),
  };
}

/**
 *
 * @param {*} email
 * @param {*} password
 * @returns {Users: {authUserId: number}}
 */
export function adminAuthLoginV1(email: string, password: string) {
  const data = getData();
  const userLoginIndex = data.users.findIndex(item => item.email === email);

  if (userLoginIndex === NOT_FOUND) {
    throw HTTPError(400, 'Email address does not exist');
  }

  if (data.users[userLoginIndex].password !== getHashOf(password)) {
    data.users[userLoginIndex].numFailedPasswordsSinceLastLogin += 1;
    setData(data);
    throw HTTPError(400, 'Password is not correct for the given email');
  }

  data.users[userLoginIndex].numFailedPasswordsSinceLastLogin = 0;
  data.users[userLoginIndex].numSuccessfulLogins += 1;

  const newSessionId = getRandomNum();
  const newToken = {
    userId: data.users[userLoginIndex].userId,
    sessionId: newSessionId.toString(),
  };
  data.tokens.push(newToken);
  setData(data);

  return {
    token: newSessionId.toString(),
  };
}

/**
 * checks if a new Quiz Id is unique or not
 * @param {} no input
 * @returns {number} - random number
 */
export function getRandomNum() {
  return Math.floor(Math.pow(Math.random() * (max - min) + min, 2));
}
