import { setData } from './dataStore';
import fs from 'fs';
import path from 'path';
/**
 * returns the state of the application back to the start
 * @param {}
 * @returns {} returns empty object
 */
export function clear(): Record<string, never> {
  fs.readdirSync('images/').forEach(image => {
    if (image !== 'default.png') {
      const imagePath = path.join('images/', image);
      fs.unlinkSync(imagePath);
    }
  });

  const csvDirectoryPath = path.join(__dirname, '..', 'csv_files');
  fs.readdirSync(csvDirectoryPath).forEach(file => {
    if (file !== 'default.txt') {
      const filePath = path.join(csvDirectoryPath, file);
      fs.unlinkSync(filePath);
    }
  });

  setData({ users: [], tokens: [], quizzes: [], quizSessions: [], trash: [] });
  return {};
}
