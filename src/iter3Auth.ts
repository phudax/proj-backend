import validator from 'validator';
import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import crypto from 'crypto';

const NOT_FOUND = -1;

/**
 * logs out a user by removing the given token/sessionId
 * @param {string} token - sessionId
 * @returns {{}}} - returns empty object
 */
export function adminAuthLogoutV2(token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(400, 'This token is for a user who has already logged out');
  }
  data.tokens.splice(tokenIndex, 1);
  setData(data);
  return {};
}

/**
 * given a users sessionId/token, returns their details
 * @param {string} token - sessionId
 * @returns {Users: {userId: number, name: string, email: string,
*                   numSuccessfulLogins: number, numFailedPasswordsSinceLastLogin: number}} - returns users details
*/
export function adminUserDetailsV2(token: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }

  const data = getData();
  const tokenId = data.tokens.find(item => item.sessionId === token);

  if (!tokenId) {
    throw HTTPError(403, 'Token is a valid structure, but is not currently logged in session');
  }
  const user = data.users.find(item => item.userId === tokenId.userId);
  const name = user.nameFirst + ' ' + user.nameLast;
  setData(data);
  return {
    user:
    {
      userId: user.userId,
      name: name,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Updates details of user excluding password
 * @param {string} token - token of user
 * @param {string} email - new email of user
 * @param {string} nameFirst - new first name
 * @param {string} nameLast - new last name
 * @returns {} - empty object
 */
export function adminUserDetailsUpdateV2(token: string, email: string, nameFirst: string, nameLast: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenIndex = data.tokens.findIndex(item => item.sessionId === token);
  if (tokenIndex === NOT_FOUND) {
    throw HTTPError(403, 'Token is not for a currently logged in session');
  }
  const userId = data.tokens[tokenIndex].userId;
  const usersExcludingTokenOwner = data.users.filter(user => user.userId !== userId);
  const emailList = (usersExcludingTokenOwner).map(a => a.email);

  if (emailList.includes(email)) {
    throw HTTPError(400, 'email is already in use by another user');
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
  }

  const userIndex = data.users.findIndex(user => user.userId === userId);

  data.users[userIndex].email = email;
  data.users[userIndex].nameFirst = nameFirst;
  data.users[userIndex].nameLast = nameLast;
  setData(data);
  return {};
}

/**
 * Updating the Password of a User
 * @param token - token of user
 * @param oldPassword - user current password
 * @param newPassword - new user password
 * @returns {} - empty object
 */
export function adminUserPasswordUpdateV2(token: string, oldPassword: string, newPassword: string) {
  if (typeof token !== 'string') {
    throw HTTPError(401, 'token is not a valid structure');
  }
  const data = getData();
  const tokenId = data.tokens.find(item => item.sessionId === token);
  if (!tokenId) {
    throw HTTPError(403, 'Token is valid a valid structure, but is not currently logged in session');
  }

  const user = data.users.find(item => item.userId === tokenId.userId);

  // push current password into previous passwords array
  user.prevPasswords.push(user.password);

  const newPasswordhash = getHashOf(newPassword);
  const oldPasswordhash = getHashOf(oldPassword);
  // error cases
  if (oldPasswordhash !== user.password) {
    throw HTTPError(400, 'Old Password is not the correct old Password');
  }
  if (newPasswordhash === oldPasswordhash) {
    throw HTTPError(400, 'Old Password and New Password match exactly');
  }
  if (user.prevPasswords.includes(newPasswordhash)) {
    throw HTTPError(400, 'Password has been used before by this user');
  }
  if (newPassword.length < 8) {
    throw HTTPError(400, 'Password is too short');
  }
  if (!/[0-9].*[a-zA-Z]|[a-zA-Z].*[0-9]/.test(newPassword)) {
    throw HTTPError(400, 'Password does not contain letter or number');
  }

  // change password
  user.password = newPasswordhash;
  setData(data);
  return {};
}

// ========================================================================
//  ================= HELPER FUNCTION BELOW THIS LINE ===================
// ========================================================================

export function getHashOf(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
