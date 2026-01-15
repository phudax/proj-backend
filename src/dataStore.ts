import fs from 'fs';

// YOU SHOULD MODIFY THIS OBJECT BELOW
export interface User {
  userId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;
  guestStatus: boolean;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  prevPasswords: string[];
}

export interface Answer {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface Question {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: Answer[];
  thumbnailUrl: string;
}

export interface Quiz {
  quizId: number;
  name: string;
  ownerUserId: number;
  numQuestions: number;
  description: string;
  questions: Question[];
  timeCreated: number;
  timeLastEdited: number;
  duration: number;
  thumbnailUrl: string;
}

export interface Player {
  playerId: number;
  name: string;
  answers: number[][];
  timeTakenAnswer: number[];
  correct: boolean[];
}

export interface MessageDetails {
  messageBody: string;
  playerId: number;
  playerName: string;
  timeSent: number;
}

export enum STATE {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

export enum COMMANDS {
  NEXT_QUESTION = 'NEXT_QUESTION',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}

export interface QuizSession {
  sessionId: number;
  state: STATE;
  atQuestion: number;
  timeQuestionLastOpened: number;
  players: Player[];
  metadata: Quiz;
  messages: MessageDetails[];
}

export interface Token {
  userId: number;
  sessionId: string;
}

export interface Data {
  users: User[];
  tokens: Token[];
  quizzes: Quiz[];
  quizSessions: QuizSession[];
  trash: Quiz[];
}

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

// Use get() to access the data
function getData(): Data {
  return JSON.parse(String(fs.readFileSync('export.json')));
}

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData: Data) {
  fs.writeFileSync('export.json', JSON.stringify(newData), { flag: 'w' });
}

export { getData, setData };
