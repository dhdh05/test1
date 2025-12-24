import jwt from 'jsonwebtoken';
import { User, Student, Teacher } from '../models/index.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'funedu', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

export const register = async (req, res) => {
  try {
    const { username, password, full_name, role = 'student', email } = req.body;

    // Validation
    if (!username || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, and full name'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this username'
      });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      full_name,
      role,
      email
    });

    // Create student or teacher record if needed
    if (role === 'student') {
      await Student.create({ user_id: user.user_id });
    } else if (role === 'teacher') {
      await Teacher.create({ user_id: user.user_id });
    }

    const token = generateToken(user.user_id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get student ID if exists (for frontend)
    // Note: Student model uses user_id as primary key, not a separate student_id
    let studentId = null;
    const student = await Student.findOne({ where: { user_id: user.user_id } });
    if (student) {
      studentId = student.user_id; // user_id is the primary key
    }

    const token = generateToken(user.user_id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        username: user.username,
        name: user.full_name,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        avatar_url: user.avatar_url
      },
      studentId: studentId || user.user_id // Fallback to user_id if not a student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const quickLogin = async (req, res) => {
  try {
    const { quick_login_code } = req.body;

    if (!quick_login_code) {
      return res.status(400).json({
        success: false,
        message: 'Quick login code is required'
      });
    }

    const student = await Student.findOne({
      where: { quick_login_code },
      include: { model: User, as: 'user' }
    });

    if (!student || !student.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid quick login code'
      });
    }

    const token = generateToken(student.user_id);

    res.json({
      success: true,
      message: 'Quick login successful',
      token,
      user: {
        user_id: student.user.user_id,
        username: student.user.username,
        full_name: student.user.full_name,
        role: student.user.role,
        avatar_url: student.user.avatar_url
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
