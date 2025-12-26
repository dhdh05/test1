-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               12.0.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table ktpmud.completed_levels
CREATE TABLE IF NOT EXISTS `completed_levels` (
  `user_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`level_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.completed_levels: ~0 rows (approximately)
INSERT INTO `completed_levels` (`user_id`, `level_id`) VALUES
	(1, 1001),
	(1, 1002),
	(6, 1),
	(6, 2001);

-- Dumping structure for table ktpmud.exercises
CREATE TABLE IF NOT EXISTS `exercises` (
  `exercise_id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `audio_url` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `correct_answer` varchar(255) DEFAULT NULL,
  `level` enum('easy','medium','hard') DEFAULT 'easy',
  `type` enum('multiple_choice','drag_drop','matching') DEFAULT 'multiple_choice',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`exercise_id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `exercises_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `json_options_check` CHECK (json_valid(`options`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.exercises: ~0 rows (approximately)

-- Dumping structure for table ktpmud.game_progress
CREATE TABLE IF NOT EXISTS `game_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `current_level` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `game_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.game_progress: ~0 rows (approximately)

-- Dumping structure for table ktpmud.lessons
CREATE TABLE IF NOT EXISTS `lessons` (
  `lesson_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `topic` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`lesson_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `lessons_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.lessons: ~0 rows (approximately)

-- Dumping structure for table ktpmud.logs
CREATE TABLE IF NOT EXISTS `logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `details` text DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.logs: ~0 rows (approximately)

-- Dumping structure for table ktpmud.parents
CREATE TABLE IF NOT EXISTS `parents` (
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `parents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.parents: ~2 rows (approximately)
INSERT INTO `parents` (`user_id`) VALUES
	(3),
	(9);

-- Dumping structure for table ktpmud.parent_notifications
CREATE TABLE IF NOT EXISTS `parent_notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` enum('progress','test_result','reminder','system') DEFAULT 'progress',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`notification_id`),
  KEY `student_id` (`student_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `parent_notifications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `parent_notifications_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.parent_notifications: ~0 rows (approximately)

-- Dumping structure for table ktpmud.progress_tracking
CREATE TABLE IF NOT EXISTS `progress_tracking` (
  `track_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `last_accessed` datetime DEFAULT NULL,
  `streak_days` int(11) DEFAULT 0,
  `total_time_spent` int(11) DEFAULT 0 COMMENT 'Tổng thời gian học (phút)',
  PRIMARY KEY (`track_id`),
  UNIQUE KEY `unique_progress` (`student_id`,`lesson_id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `progress_tracking_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `progress_tracking_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.progress_tracking: ~0 rows (approximately)

-- Dumping structure for table ktpmud.rewards
CREATE TABLE IF NOT EXISTS `rewards` (
  `reward_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `reward_title` varchar(100) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `date_awarded` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`reward_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.rewards: ~0 rows (approximately)

-- Dumping structure for table ktpmud.students
CREATE TABLE IF NOT EXISTS `students` (
  `user_id` int(11) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `class_name` varchar(50) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `quick_login_code` varchar(6) DEFAULT NULL,
  `total_stars` int(11) DEFAULT 0,
  `current_level` int(11) DEFAULT 1,
  PRIMARY KEY (`user_id`),
  KEY `parent_id` (`parent_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.students: ~7 rows (approximately)
INSERT INTO `students` (`user_id`, `date_of_birth`, `class_name`, `parent_id`, `teacher_id`, `quick_login_code`, `total_stars`, `current_level`) VALUES
	(1, '2020-01-01', 'Lá Mầm', 9, 2, NULL, 10, 1),
	(5, NULL, NULL, 9, NULL, NULL, 0, 1),
	(6, NULL, NULL, 9, NULL, NULL, 0, 1),
	(7, NULL, NULL, NULL, NULL, NULL, 0, 1),
	(8, NULL, NULL, NULL, NULL, NULL, 0, 1),
	(10, NULL, NULL, NULL, NULL, NULL, 0, 1),
	(11, NULL, NULL, NULL, NULL, NULL, 0, 1);

-- Dumping structure for table ktpmud.teachers
CREATE TABLE IF NOT EXISTS `teachers` (
  `user_id` int(11) NOT NULL,
  `subject` varchar(50) DEFAULT 'Toán',
  `hire_date` date DEFAULT curdate(),
  `bio` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.teachers: ~1 rows (approximately)
INSERT INTO `teachers` (`user_id`, `subject`, `hire_date`, `bio`, `status`) VALUES
	(2, 'Toán Tư Duy', '2025-12-21', 'Giáo viên 10 năm kinh nghiệm dạy trẻ', 'active');

-- Dumping structure for table ktpmud.tests
CREATE TABLE IF NOT EXISTS `tests` (
  `test_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL COMMENT 'Thời gian làm bài (phút)',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`test_id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tests_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.tests: ~1 rows (approximately)
INSERT INTO `tests` (`test_id`, `title`, `lesson_id`, `duration`, `created_by`, `created_at`) VALUES
	(1, 'Luyện tập tự do', NULL, NULL, NULL, '2025-12-21 14:03:57');

-- Dumping structure for table ktpmud.test_exercises
CREATE TABLE IF NOT EXISTS `test_exercises` (
  `test_id` int(11) NOT NULL,
  `exercise_id` int(11) NOT NULL,
  `seq` int(11) DEFAULT 1 COMMENT 'Thứ tự câu hỏi',
  PRIMARY KEY (`test_id`,`exercise_id`),
  KEY `exercise_id` (`exercise_id`),
  CONSTRAINT `test_exercises_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `tests` (`test_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `test_exercises_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`exercise_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.test_exercises: ~0 rows (approximately)

-- Dumping structure for table ktpmud.test_results
CREATE TABLE IF NOT EXISTS `test_results` (
  `result_id` int(11) NOT NULL AUTO_INCREMENT,
  `test_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `score` float DEFAULT 0,
  `total_questions` int(11) DEFAULT NULL,
  `correct_count` int(11) DEFAULT NULL,
  `time_spent` int(11) DEFAULT NULL COMMENT 'Thời gian hoàn thành (giây)',
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `teacher_feedback` text DEFAULT NULL,
  PRIMARY KEY (`result_id`),
  KEY `test_id` (`test_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `test_results_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `tests` (`test_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `test_results_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.test_results: ~23 rows (approximately)
INSERT INTO `test_results` (`result_id`, `test_id`, `student_id`, `score`, `total_questions`, `correct_count`, `time_spent`, `submitted_at`, `teacher_feedback`) VALUES
	(1, 1, 5, 10, 3, 3, NULL, '2025-12-21 14:17:58', NULL),
	(2, 1, 5, 10, 4, 4, NULL, '2025-12-21 14:18:22', NULL),
	(3, 1, 5, 10, 3, 3, NULL, '2025-12-21 14:18:34', NULL),
	(4, 1, 5, 2.72727, 11, 3, NULL, '2025-12-21 14:19:08', NULL),
	(5, 1, 7, 5, 6, 3, NULL, '2025-12-21 14:28:49', NULL),
	(6, 1, 8, 4.28571, 7, 3, NULL, '2025-12-21 14:33:24', NULL),
	(7, 1, 5, 7.5, 4, 3, NULL, '2025-12-21 15:54:18', NULL),
	(8, 1, 5, 5, 6, 3, NULL, '2025-12-21 15:54:33', NULL),
	(9, 1, 1, 5, 6, 3, NULL, '2025-12-21 16:13:53', NULL),
	(10, 1, 1, 6, 5, 3, NULL, '2025-12-21 16:17:18', NULL),
	(11, 1, 1, 7.5, 4, 3, NULL, '2025-12-21 16:19:13', NULL),
	(12, 1, 1, 10, 3, 3, NULL, '2025-12-21 16:28:51', NULL),
	(13, 1, 1, 10, 3, 3, NULL, '2025-12-21 16:28:58', NULL),
	(14, 1, 1, 5, 6, 3, NULL, '2025-12-21 16:29:36', NULL),
	(15, 1, 5, 10, 3, 3, NULL, '2025-12-22 19:36:38', NULL),
	(16, 1, 1, 6, 5, 3, NULL, '2025-12-22 20:45:27', NULL),
	(17, 1, 1, 7.5, 4, 3, NULL, '2025-12-22 20:45:36', NULL),
	(18, 1, 1, 7.5, 4, 3, NULL, '2025-12-22 20:46:40', NULL),
	(19, 1, 1, 10, 3, 3, NULL, '2025-12-22 20:53:23', NULL),
	(20, 1, 11, 10, 3, 3, NULL, '2025-12-22 21:16:17', NULL),
	(21, 1, 11, 5, 6, 3, NULL, '2025-12-22 21:16:30', NULL),
	(22, 1, 11, 10, 3, 3, NULL, '2025-12-22 21:16:47', NULL),
	(23, 1, 11, 10, 3, 3, NULL, '2025-12-22 21:17:11', NULL),
	(24, 1, 1, 10, 3, 3, NULL, '2025-12-23 11:07:22', NULL),
	(25, 1, 1, 10, 3, 3, NULL, '2025-12-23 11:11:50', NULL),
	(26, 1, 6, 7.5, 4, 3, NULL, '2025-12-23 11:12:52', NULL),
	(27, 1, 6, 10, 3, 3, NULL, '2025-12-23 11:13:09', NULL);

-- Dumping structure for table ktpmud.users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `avatar_url` varchar(255) DEFAULT 'default_avatar.png',
  `role` enum('admin','teacher','student','parent') NOT NULL DEFAULT 'student',
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.users: ~11 rows (approximately)
INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `avatar_url`, `role`, `email`, `phone`, `created_at`, `updated_at`) VALUES
	(1, 'hocsinh', '123', 'Bé Bi (5 tuổi)', 'default_avatar.png', 'student', NULL, NULL, '2025-12-21 03:02:50', '2025-12-21 03:02:50'),
	(2, 'giaovien', '123', 'Cô Giáo Hạnh', 'default_avatar.png', 'teacher', NULL, NULL, '2025-12-21 03:02:50', '2025-12-21 03:02:50'),
	(3, 'phuhuynh', '123', 'Mẹ Bé Bi', 'default_avatar.png', 'parent', NULL, NULL, '2025-12-21 03:02:50', '2025-12-21 03:02:50'),
	(4, 'admin', '123', 'Quản Trị Viên', 'default_avatar.png', 'admin', NULL, NULL, '2025-12-21 03:02:50', '2025-12-21 03:02:50'),
	(5, 'st_Nam', '123', 'Be Nam', 'default_avatar.png', 'student', NULL, NULL, '2025-12-21 14:00:42', '2025-12-21 14:00:42'),
	(6, 'st_Trung', '123', 'Be Phan Cong Trung', 'default_avatar.png', 'student', NULL, NULL, '2025-12-21 14:23:25', '2025-12-21 14:23:25'),
	(7, 'st_Huy', '123', 'Be Nguyen Quang Huy', 'default_avatar.png', 'student', NULL, NULL, '2025-12-21 14:27:52', '2025-12-21 14:27:52'),
	(8, 'hocsinhmoi-trung', '123', 'trung', 'default_avatar.png', 'student', NULL, NULL, '2025-12-21 14:32:24', '2025-12-21 14:32:24'),
	(9, 'phuhuynhmoi-Hieu', '123', 'Hieu', 'default_avatar.png', 'parent', NULL, NULL, '2025-12-21 14:57:28', '2025-12-21 14:57:28'),
	(10, '123', '123', 'hocsinhmoi-Linh', 'default_avatar.png', 'student', NULL, NULL, '2025-12-22 21:13:55', '2025-12-22 21:13:55'),
	(11, 'st_Lunh', '123', 'Lunh', 'default_avatar.png', 'student', NULL, NULL, '2025-12-22 21:15:31', '2025-12-22 21:15:31');

-- Dumping structure for table ktpmud.game_levels
CREATE TABLE IF NOT EXISTS `game_levels` (
  `level_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_type` enum('hoc-so','ghep-so','chan-le','so-sanh','xep-so') NOT NULL,
  `level_number` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty` enum('easy','medium','hard') DEFAULT 'easy',
  `time_limit` int(11) DEFAULT 120 COMMENT 'Thời gian giới hạn (giây)',
  `required_score` int(11) DEFAULT 60 COMMENT 'Điểm yêu cầu để vượt qua (%)',
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Cấu hình game (JSON)',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`level_id`),
  KEY `idx_game_type` (`game_type`),
  CONSTRAINT `json_config_check` CHECK (json_valid(`config`))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table ktpmud.game_levels: ~23 rows
INSERT INTO `game_levels` (`level_id`, `game_type`, `level_number`, `title`, `description`, `difficulty`, `time_limit`, `required_score`, `config`, `created_at`, `updated_at`) VALUES
	(1, 'hoc-so', 1, 'Học từ 0 đến 3', 'Nhận biết và học các số từ 0 đến 3 với hình ảnh và âm thanh', 'easy', 120, 60, '{"numbers":[0,1,2,3],"hasAudio":true}', NOW(), NOW()),
	(2, 'hoc-so', 2, 'Học từ 4 đến 6', 'Nhận biết và học các số từ 4 đến 6 với hình ảnh và âm thanh', 'easy', 120, 60, '{"numbers":[4,5,6],"hasAudio":true}', NOW(), NOW()),
	(3, 'hoc-so', 3, 'Học từ 7 đến 9', 'Nhận biết và học các số từ 7 đến 9 với hình ảnh và âm thanh', 'medium', 120, 70, '{"numbers":[7,8,9],"hasAudio":true}', NOW(), NOW()),
	(4, 'hoc-so', 4, 'Ôn tập 0 đến 9', 'Ôn tập tất cả các số từ 0 đến 9', 'medium', 150, 75, '{"numbers":[0,1,2,3,4,5,6,7,8,9],"hasAudio":true}', NOW(), NOW()),
	(5, 'ghep-so', 1, 'Ghép số 1-3', 'Kéo thả các số để ghép với đúng số lượng hình ảnh', 'easy', 120, 70, '{"numbers":[1,2,3],"hasIcons":true,"levels":3}', NOW(), NOW()),
	(6, 'ghep-so', 2, 'Ghép số 4-6', 'Kéo thả các số để ghép với số lượng hình ảnh từ 4 đến 6', 'easy', 120, 70, '{"numbers":[4,5,6],"hasIcons":true,"levels":3}', NOW(), NOW()),
	(7, 'ghep-so', 3, 'Ghép số 7-9', 'Kéo thả các số để ghép với số lượng hình ảnh từ 7 đến 9', 'medium', 120, 75, '{"numbers":[7,8,9],"hasIcons":true,"levels":3}', NOW(), NOW()),
	(8, 'ghep-so', 4, 'Ghép hỗn hợp', 'Kéo thả các số để ghép với số lượng hình ảnh hỗn hợp', 'medium', 150, 75, '{"numbers":[1,2,3,4,5,6,7,8,9],"hasIcons":true,"levels":4}', NOW(), NOW()),
	(9, 'ghep-so', 5, 'Ghép thách thức', 'Thách thức: Ghép các số ngẫu nhiên nhanh chóng', 'hard', 90, 80, '{"numbers":[0,1,2,3,4,5,6,7,8,9],"hasIcons":true,"levels":5,"speedMode":true}', NOW(), NOW()),
	(10, 'ghep-so', 6, 'Vua ghép số', 'Cấp độ cao nhất: Tốc độ và độ chính xác', 'hard', 60, 85, '{"numbers":[0,1,2,3,4,5,6,7,8,9],"hasIcons":true,"levels":6,"speedMode":true}', NOW(), NOW()),
	(11, 'chan-le', 1, 'Nhận biết chẵn lẻ 1-5', 'Phân loại các số từ 1 đến 5 là chẵn hay lẻ', 'easy', 120, 70, '{"numbers":[1,2,3,4,5],"range":"1-5"}', NOW(), NOW()),
	(12, 'chan-le', 2, 'Nhận biết chẵn lẻ 1-9', 'Phân loại các số từ 1 đến 9 là chẵn hay lẻ', 'medium', 120, 75, '{"numbers":[1,2,3,4,5,6,7,8,9],"range":"1-9"}', NOW(), NOW()),
	(13, 'chan-le', 3, 'Tốc độ chẵn lẻ', 'Phân loại chẵn lẻ với thời gian giới hạn', 'hard', 90, 80, '{"numbers":[1,2,3,4,5,6,7,8,9],"range":"1-9","speedMode":true}', NOW(), NOW()),
	(14, 'so-sanh', 1, 'So sánh 1-3', 'So sánh số lớn hơn, nhỏ hơn hoặc bằng với các số từ 1 đến 3', 'easy', 120, 70, '{"numbers":[1,2,3],"comparisons":[">","<","="]}', NOW(), NOW()),
	(15, 'so-sanh', 2, 'So sánh 1-6', 'So sánh số lớn hơn, nhỏ hơn hoặc bằng với các số từ 1 đến 6', 'medium', 120, 75, '{"numbers":[1,2,3,4,5,6],"comparisons":[">","<","="]}', NOW(), NOW()),
	(16, 'so-sanh', 3, 'So sánh 1-9', 'So sánh số lớn hơn, nhỏ hơn hoặc bằng với các số từ 1 đến 9', 'hard', 120, 80, '{"numbers":[1,2,3,4,5,6,7,8,9],"comparisons":[">","<","="]}', NOW(), NOW()),
	(17, 'xep-so', 1, 'Xếp số từ bé đến lớn 1-3', 'Sắp xếp các số từ 1 đến 3 theo thứ tự từ bé đến lớn', 'easy', 120, 70, '{"numbers":[1,2,3],"sortOrder":"ascending"}', NOW(), NOW()),
	(18, 'xep-so', 2, 'Xếp số từ bé đến lớn 1-6', 'Sắp xếp các số từ 1 đến 6 theo thứ tự từ bé đến lớn', 'medium', 120, 75, '{"numbers":[1,2,3,4,5,6],"sortOrder":"ascending"}', NOW(), NOW()),
	(19, 'xep-so', 3, 'Xếp số từ bé đến lớn 1-9', 'Sắp xếp các số từ 1 đến 9 theo thứ tự từ bé đến lớn', 'hard', 120, 80, '{"numbers":[1,2,3,4,5,6,7,8,9],"sortOrder":"ascending"}', NOW(), NOW()),
	(20, 'xep-so', 4, 'Xếp số từ lớn đến bé 1-9', 'Sắp xếp các số từ 1 đến 9 theo thứ tự từ lớn đến bé', 'hard', 120, 80, '{"numbers":[1,2,3,4,5,6,7,8,9],"sortOrder":"descending"}', NOW(), NOW());

-- Dumping structure for table ktpmud.game_results
CREATE TABLE IF NOT EXISTS `game_results` (
  `result_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `game_type` enum('hoc-so','ghep-so','chan-le','so-sanh','xep-so') NOT NULL,
  `score` int(11) DEFAULT 0 COMMENT 'Điểm từ 0-100',
  `max_score` int(11) DEFAULT 100,
  `stars` int(11) DEFAULT 0 COMMENT 'Số sao từ 0-3',
  `time_spent` int(11) DEFAULT 0 COMMENT 'Thời gian chơi (giây)',
  `attempts` int(11) DEFAULT 1 COMMENT 'Số lần thử',
  `is_passed` tinyint(1) DEFAULT 0,
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Chi tiết câu trả lời (JSON)',
  `completed_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`result_id`),
  KEY `idx_student_game` (`student_id`,`game_type`),
  KEY `idx_level` (`level_id`),
  CONSTRAINT `game_results_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `game_results_ibfk_2` FOREIGN KEY (`level_id`) REFERENCES `game_levels` (`level_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `json_answers_check` CHECK (json_valid(`answers`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping structure for table ktpmud.student_game_progress
CREATE TABLE IF NOT EXISTS `student_game_progress` (
  `progress_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `game_type` enum('hoc-so','ghep-so','chan-le','so-sanh','xep-so') NOT NULL,
  `current_level` int(11) DEFAULT 1,
  `highest_level_passed` int(11) DEFAULT 0,
  `total_stars` int(11) DEFAULT 0,
  `total_attempts` int(11) DEFAULT 0,
  `last_played_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`progress_id`),
  UNIQUE KEY `unique_student_game` (`student_id`,`game_type`),
  KEY `idx_game_type` (`game_type`),
  CONSTRAINT `student_game_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping structure for table ktpmud.game_achievements
CREATE TABLE IF NOT EXISTS `game_achievements` (
  `achievement_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `game_type` varchar(20) DEFAULT NULL,
  `achievement_type` enum('first_play','perfect_score','level_master','streak_5','streak_10','speedrun','game_guru','star_collector') NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon_url` varchar(255) DEFAULT NULL,
  `earned_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`achievement_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_achievement_type` (`achievement_type`),
  CONSTRAINT `game_achievements_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
