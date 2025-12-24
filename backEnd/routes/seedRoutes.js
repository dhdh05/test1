import express from 'express';
import { sequelize } from '../config/database.js';
import {
    Student,
    GameLevel,
    GameResult,
    StudentGameProgress,
    GameAchievement
} from '../models/index.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Seed endpoint - ONLY for development/initial setup
router.post('/seed-all', async (req, res) => {
    try {
        // Check if already seeded
        const studentCount = await Student.count();
        if (studentCount > 0) {
            return res.json({
                success: false,
                message: 'Database already seeded. Students exist.',
                count: studentCount
            });
        }

        // Seed students
        const hashedPassword = await bcrypt.hash('123456', 10);
        const students = await Student.bulkCreate([
            { username: 'hocsinh1', password: hashedPassword, full_name: 'Nguyễn Văn A', email: 'hocsinh1@test.com' },
            { username: 'hocsinh2', password: hashedPassword, full_name: 'Trần Thị B', email: 'hocsinh2@test.com' },
            { username: 'hocsinh3', password: hashedPassword, full_name: 'Lê Văn C', email: 'hocsinh3@test.com' },
            { username: 'hocsinh4', password: hashedPassword, full_name: 'Phạm Thị D', email: 'hocsinh4@test.com' },
            { username: 'hocsinh5', password: hashedPassword, full_name: 'Hoàng Văn E', email: 'hocsinh5@test.com' }
        ]);

        // Seed game levels
        const gameLevels = [
            // Học số
            { game_type: 'hoc-so', level_number: 1, title: 'Số 1-5', description: 'Làm quen với số từ 1 đến 5', difficulty: 'easy', time_limit: 60 },
            { game_type: 'hoc-so', level_number: 2, title: 'Số 6-10', description: 'Học số từ 6 đến 10', difficulty: 'easy', time_limit: 60 },
            { game_type: 'hoc-so', level_number: 3, title: 'Số 11-20', description: 'Học số từ 11 đến 20', difficulty: 'medium', time_limit: 90 },

            // Ghép số
            { game_type: 'ghep-so', level_number: 1, title: 'Ghép số đơn giản', description: 'Ghép các số giống nhau', difficulty: 'easy', time_limit: 60 },
            { game_type: 'ghep-so', level_number: 2, title: 'Ghép số nâng cao', description: 'Ghép số theo quy luật', difficulty: 'medium', time_limit: 90 },

            // Chẵn lẻ
            { game_type: 'chan-le', level_number: 1, title: 'Phân biệt chẵn lẻ', description: 'Học cách phân biệt số chẵn và số lẻ', difficulty: 'easy', time_limit: 60 },
            { game_type: 'chan-le', level_number: 2, title: 'Chẵn lẻ nâng cao', description: 'Phân biệt chẵn lẻ với số lớn', difficulty: 'medium', time_limit: 90 },

            // So sánh
            { game_type: 'so-sanh', level_number: 1, title: 'So sánh cơ bản', description: 'So sánh hai số', difficulty: 'easy', time_limit: 60 },
            { game_type: 'so-sanh', level_number: 2, title: 'So sánh nhiều số', description: 'So sánh ba số trở lên', difficulty: 'medium', time_limit: 90 },

            // Xếp số
            { game_type: 'xep-so', level_number: 1, title: 'Xếp số tăng dần', description: 'Sắp xếp số từ bé đến lớn', difficulty: 'easy', time_limit: 60 },
            { game_type: 'xep-so', level_number: 2, title: 'Xếp số giảm dần', description: 'Sắp xếp số từ lớn đến bé', difficulty: 'medium', time_limit: 90 }
        ];

        await GameLevel.bulkCreate(gameLevels);

        // Create some sample progress
        const student1 = students[0];
        await StudentGameProgress.create({
            student_id: student1.student_id,
            game_type: 'hoc-so',
            current_level: 2,
            highest_level_passed: 1,
            total_stars: 3,
            total_attempts: 5
        });

        res.json({
            success: true,
            message: 'Database seeded successfully!',
            data: {
                students: students.length,
                gameLevels: gameLevels.length,
                note: 'Default password for all students: 123456'
            }
        });

    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding database',
            error: error.message
        });
    }
});

// Check seed status
router.get('/seed-status', async (req, res) => {
    try {
        const studentCount = await Student.count();
        const levelCount = await GameLevel.count();
        const progressCount = await StudentGameProgress.count();

        res.json({
            success: true,
            data: {
                students: studentCount,
                gameLevels: levelCount,
                progress: progressCount,
                seeded: studentCount > 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
