import { sequelize } from '../config/database.js';
import User from './User.js';
import Student from './Student.js';
import Teacher from './Teacher.js';
import Lesson from './Lesson.js';
import Exercise from './Exercise.js';
import Test from './Test.js';
import TestResult from './TestResult.js';
import ProgressTracking from './ProgressTracking.js';
import CompletedLevel from './CompletedLevel.js';
import Reward from './Reward.js';
import GameLevel from './GameLevel.js';
import GameResult from './GameResult.js';
import StudentGameProgress from './StudentGameProgress.js';
import GameAchievement from './GameAchievement.js';

export {
  sequelize,
  User,
  Student,
  Teacher,
  Lesson,
  Exercise,
  Test,
  TestResult,
  ProgressTracking,
  CompletedLevel,
  Reward,
  GameLevel,
  GameResult,
  StudentGameProgress,
  GameAchievement
};
