-- MySQL Database Backup
-- Database: loan_management
-- Date: 2026-09-02T18:22:59.856Z

SET FOREIGN_KEY_CHECKS=0;

-- Table structure for table `audit_logs`
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity`),
  KEY `idx_entity_id` (`entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `audit_logs`
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (1, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-01 18:22:54');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (2, 1, 'CREATE', 'capital_transaction', '1', NULL, '[object Object]', NULL, NULL, '2026-09-01 18:47:39');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (3, 1, 'CREATE', 'capital_transaction', '2', NULL, '[object Object]', NULL, NULL, '2026-09-01 18:57:25');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (4, 1, 'UPDATE', 'capital_transaction', '1', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 18:57:35');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (5, 1, 'UPDATE', 'capital_transaction', '1', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 18:57:46');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (6, 1, 'CREATE', 'capital_transaction', '3', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:06:52');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (7, 1, 'DELETE', 'capital_transaction', '3', '[object Object]', NULL, NULL, NULL, '2026-09-01 19:07:09');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (8, 1, 'UPDATE', 'capital_transaction', '1', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:07:27');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (9, 1, 'UPDATE', 'capital_transaction', '1', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:07:34');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (10, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:22:55');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (11, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:23:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (12, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:24:51');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (13, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:25:20');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (14, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:25:49');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (15, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:26:24');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (16, 1, 'CREATE', 'borrower', '1', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:26:24');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (17, 1, 'CREATE', 'borrower', '2', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:30:52');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (18, 1, 'UPDATE', 'borrower', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:31:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (19, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:41:20');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (20, 1, 'CREATE', 'loan', '1', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:41:20');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (21, 1, 'CREATE', 'loan', '2', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:41:20');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (22, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'axios/1.20.0', '2026-09-01 19:41:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (23, 1, 'CREATE', 'loan', '3', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:41:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (24, 1, 'CREATE', 'loan', '4', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:41:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (25, 1, 'UPDATE_STATUS', 'loan', '3', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:41:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (26, 1, 'DELETE', 'loan', '4', '[object Object]', NULL, NULL, NULL, '2026-09-01 19:41:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (27, 1, 'CREATE', 'loan', '5', NULL, '[object Object]', NULL, NULL, '2026-09-01 19:52:31');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (28, 1, 'UPDATE', 'loan', '5', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:52:45');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (29, 1, 'UPDATE_STATUS', 'loan', '5', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:54:03');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (30, 1, 'UPDATE_STATUS', 'loan', '5', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:54:11');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (31, 1, 'UPDATE_STATUS', 'loan', '3', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:54:41');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (32, 1, 'UPDATE_STATUS', 'loan', '3', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 19:54:49');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (33, 1, 'DELETE', 'loan', '3', '[object Object]', NULL, NULL, NULL, '2026-09-01 20:05:12');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (34, 1, 'DELETE', 'loan', '1', '[object Object]', NULL, NULL, NULL, '2026-09-01 20:05:14');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (35, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:25:39');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (36, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:26:08');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (37, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:26:40');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (38, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:36:06');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (39, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:48:57');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (40, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:49:27');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (41, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:53:20');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (42, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:53:26');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (43, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:54:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (44, 1, 'UPDATE', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:54:30');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (45, 1, 'UPDATE_STATUS', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:57:46');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (46, 1, 'UPDATE_STATUS', 'loan', '2', '[object Object]', '[object Object]', NULL, NULL, '2026-09-01 20:58:10');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (47, 1, 'CREATE', 'payment', '4', NULL, '[object Object]', NULL, NULL, '2026-09-01 21:11:24');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (48, 1, 'CREATE', 'payment', '5', NULL, '[object Object]', NULL, NULL, '2026-09-01 21:12:45');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (49, 1, 'CREATE', 'borrower', '4', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (50, 1, 'CREATE', 'borrower', '5', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (51, 1, 'CREATE', 'borrower', '6', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (52, 1, 'CREATE', 'borrower', '7', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (53, 1, 'CREATE', 'borrower', '8', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (54, 1, 'CREATE', 'borrower', '9', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (55, 1, 'CREATE', 'borrower', '10', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (56, 1, 'CREATE', 'borrower', '11', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (57, 1, 'CREATE', 'borrower', '12', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (58, 1, 'CREATE', 'borrower', '13', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (59, 1, 'CREATE', 'borrower', '14', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (60, 1, 'CREATE', 'borrower', '15', NULL, '[object Object]', NULL, NULL, '2026-09-01 22:01:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (61, 1, 'CREATE', 'borrower', '16', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:21:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (62, 1, 'CREATE', 'loan', '11', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:21:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (63, 1, 'CREATE', 'payment', '9', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:21:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (64, 1, 'CREATE', 'borrower', '17', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (65, 1, 'CREATE', 'loan', '12', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (66, 1, 'CREATE', 'payment', '10', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (67, 1, 'CREATE', 'payment', '11', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (68, 1, 'CREATE', 'loan', '13', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (69, 1, 'CREATE', 'loan', '14', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (70, 1, 'CREATE', 'payment', '12', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (71, 1, 'CREATE', 'payment', '13', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (72, 1, 'CREATE', 'loan', '15', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:02');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (73, 1, 'CREATE', 'borrower', '18', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (74, 1, 'CREATE', 'loan', '16', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (75, 1, 'CREATE', 'payment', '14', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (76, 1, 'CREATE', 'payment', '15', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (77, 1, 'CREATE', 'loan', '17', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (78, 1, 'CREATE', 'loan', '18', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (79, 1, 'CREATE', 'payment', '16', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (80, 1, 'CREATE', 'payment', '17', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (81, 1, 'CREATE', 'loan', '19', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (82, 1, 'CREATE', 'payment', '18', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (83, 1, 'VOID', 'payment', '18', '[object Object]', '[object Object]', NULL, NULL, '2026-09-02 03:22:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (84, 1, 'CREATE', 'borrower', '19', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (85, 1, 'CREATE', 'borrower', '20', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:23');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (86, 1, 'CREATE', 'borrower', '21', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (87, 1, 'CREATE', 'loan', '20', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (88, 1, 'CREATE', 'payment', '19', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (89, 1, 'CREATE', 'payment', '20', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (90, 1, 'CREATE', 'loan', '21', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (91, 1, 'CREATE', 'loan', '22', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (92, 1, 'CREATE', 'payment', '21', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (93, 1, 'CREATE', 'payment', '22', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (94, 1, 'CREATE', 'loan', '23', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (95, 1, 'CREATE', 'payment', '23', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (96, 1, 'VOID', 'payment', '23', '[object Object]', '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (97, 1, 'CREATE', 'borrower', '22', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (98, 1, 'CREATE', 'borrower', '23', NULL, '[object Object]', NULL, NULL, '2026-09-02 03:22:44');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (99, 1, 'CREATE', 'borrower', '24', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (100, 1, 'CREATE', 'loan', '24', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (101, 1, 'CREATE', 'payment', '24', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (102, 1, 'CREATE', 'payment', '25', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (103, 1, 'CREATE', 'loan', '25', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (104, 1, 'CREATE', 'loan', '26', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (105, 1, 'CREATE', 'payment', '26', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (106, 1, 'CREATE', 'payment', '27', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (107, 1, 'CREATE', 'loan', '27', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (108, 1, 'CREATE', 'payment', '28', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (109, 1, 'VOID', 'payment', '28', '[object Object]', '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (110, 1, 'CREATE', 'borrower', '25', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (111, 1, 'CREATE', 'borrower', '26', NULL, '[object Object]', NULL, NULL, '2026-09-02 04:05:05');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (112, 1, 'LOGIN', 'user', '1', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-02 04:06:32');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (113, 1, 'UPDATE', 'settings', 'config', NULL, '[object Object]', NULL, NULL, '2026-09-02 07:08:05');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (114, 1, 'UPDATE', 'settings', 'config', NULL, '[object Object]', NULL, NULL, '2026-09-02 07:09:04');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (115, 1, 'UPDATE', 'settings', 'config', NULL, '[object Object]', NULL, NULL, '2026-09-02 07:09:50');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (116, 1, 'UPDATE', 'settings', 'config', NULL, '[object Object]', NULL, NULL, '2026-09-02 07:10:59');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (117, 1, 'UPDATE', 'loan', '15', '[object Object]', '[object Object]', NULL, NULL, '2026-09-02 10:19:48');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (118, 1, 'UPDATE', 'loan', '15', '[object Object]', '[object Object]', NULL, NULL, '2026-09-02 10:20:54');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (119, 1, 'UPDATE', 'loan', '15', '[object Object]', '[object Object]', NULL, NULL, '2026-09-02 10:21:11');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`) VALUES (120, 1, 'UPDATE', 'loan', '15', '[object Object]', '[object Object]', NULL, NULL, '2026-09-02 10:21:27');

-- Table structure for table `borrowers`
DROP TABLE IF EXISTS `borrowers`;
CREATE TABLE `borrowers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `borrower_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive','blacklisted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `borrower_id` (`borrower_id`),
  KEY `idx_borrower_id` (`borrower_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_borrowers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `borrowers`
INSERT INTO `borrowers` (`id`, `borrower_id`, `full_name`, `phone`, `email`, `address`, `notes`, `status`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (1, 'BOR-001', 'Test Borrower', '9876543210', 'test@example.com', '123 Test St', 'Test notes', 'active', 1, '2026-09-01 19:26:24', '2026-09-01 19:26:24', NULL);
INSERT INTO `borrowers` (`id`, `borrower_id`, `full_name`, `phone`, `email`, `address`, `notes`, `status`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (2, 'BOR-002', 'Test Test', '9999599991', 'test02@codeclouds.com', '1050 West Romeo Road', 'Test', 'active', 1, '2026-09-01 19:30:52', '2026-09-01 19:31:01', NULL);
INSERT INTO `borrowers` (`id`, `borrower_id`, `full_name`, `phone`, `email`, `address`, `notes`, `status`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (16, 'BOR-003', 'Financial Scenario Borrower 1788319283559', '+91 9555518940', 'scenario_1788319283559@test.com', 'Test City', NULL, 'active', 1, '2026-09-02 03:21:23', '2026-09-02 03:21:23', NULL);
INSERT INTO `borrowers` (`id`, `borrower_id`, `full_name`, `phone`, `email`, `address`, `notes`, `status`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (17, 'BOR-004', 'Financial Scenario Borrower 1788319322006', '+91 9555561786', 'scenario_1788319322006@test.com', 'Test City', NULL, 'active', 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02', NULL);

-- Table structure for table `capital_transactions`
DROP TABLE IF EXISTS `capital_transactions`;
CREATE TABLE `capital_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('capital_given','capital_returned','adjustment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `running_balance` decimal(15,2) NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_capital_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_capital_amount_positive` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `capital_transactions`
INSERT INTO `capital_transactions` (`id`, `transaction_id`, `transaction_date`, `transaction_type`, `amount`, `source`, `destination`, `description`, `reference_number`, `notes`, `running_balance`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (1, 'CAP-001', '2026-08-11 18:30:00', 'capital_given', '10000.00', 'test', 'Test', 'Sent the money to the prince', 'CAP-001', NULL, '10000.00', 1, '2026-09-01 18:47:39', '2026-09-01 19:07:34', NULL);
INSERT INTO `capital_transactions` (`id`, `transaction_id`, `transaction_date`, `transaction_type`, `amount`, `source`, `destination`, `description`, `reference_number`, `notes`, `running_balance`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (2, 'CAP-002', '2026-08-12 18:30:00', 'capital_given', '15000.00', 'test', 'Test', 'Sent the money to the prince', 'CAP-002', 'Test', '25000.00', 1, '2026-09-01 18:57:25', '2026-09-01 18:57:46', NULL);
INSERT INTO `capital_transactions` (`id`, `transaction_id`, `transaction_date`, `transaction_type`, `amount`, `source`, `destination`, `description`, `reference_number`, `notes`, `running_balance`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (3, 'CAP-003', '2026-09-01 18:30:00', 'capital_returned', '500.00', 'test', 'Test', 'Sent the money to the Rohit', 'CAP-003', NULL, '24500.00', 1, '2026-09-01 19:06:52', '2026-09-01 19:07:09', '2026-09-01 19:07:09');

-- Table structure for table `loans`
DROP TABLE IF EXISTS `loans`;
CREATE TABLE `loans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `borrower_id` int NOT NULL,
  `principal_amount` decimal(15,2) NOT NULL,
  `interest_rate` decimal(10,4) NOT NULL,
  `interest_rate_type` enum('monthly','daily','flat') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `tenure` int DEFAULT NULL,
  `tenure_unit` enum('days','months','years') COLLATE utf8mb4_unicode_ci DEFAULT 'months',
  `loan_given_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `total_expected_interest` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_expected_repayment` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','overdue','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `settlement_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loan_id` (`loan_id`),
  KEY `idx_loan_id` (`loan_id`),
  KEY `idx_borrower_id` (`borrower_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_loan_given_date` (`loan_given_date`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_loans_borrower` FOREIGN KEY (`borrower_id`) REFERENCES `borrowers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_loans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_interest_non_negative` CHECK ((`interest_rate` >= 0)),
  CONSTRAINT `chk_principal_positive` CHECK ((`principal_amount` > 0)),
  CONSTRAINT `chk_tenure_positive` CHECK ((`tenure` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `loans`
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (1, 'LN-001', 2, '50000.00', '3.0000', 'monthly', 6, 'months', '2026-07-31 18:30:00', '2027-01-31 18:30:00', '9000.00', '59000.00', 'active', NULL, 'Personal business expansion loan with inventory collateral', 1, '2026-09-01 19:41:20', '2026-09-01 20:05:14', '2026-09-01 20:05:14');
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (2, 'LN-002', 2, '10000.00', '3.0000', 'monthly', 1, 'months', '2026-08-09 18:30:00', '2026-09-09 18:30:00', '300.00', '10300.00', 'active', NULL, 'Short term working capital', 1, '2026-09-01 19:41:20', '2026-09-01 20:58:10', NULL);
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (3, 'LN-003', 2, '50000.00', '3.0000', 'monthly', 6, 'months', '2026-07-31 18:30:00', '2027-01-31 18:30:00', '9000.00', '59000.00', 'overdue', NULL, 'Personal business expansion loan with inventory collateral', 1, '2026-09-01 19:41:44', '2026-09-01 20:05:12', '2026-09-01 20:05:12');
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (4, 'LN-004', 2, '10000.00', '3.0000', 'daily', 15, 'days', '2026-08-09 18:30:00', '2026-08-24 18:30:00', '150.00', '10150.00', 'active', NULL, 'Short term working capital', 1, '2026-09-01 19:41:44', '2026-09-01 19:41:44', '2026-09-01 19:41:44');
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (5, 'LN-005', 1, '5000.00', '5.0000', 'flat', 1, 'months', '2026-08-31 18:30:00', '2026-09-30 18:30:00', '250.00', '5250.00', 'active', NULL, NULL, 1, '2026-09-01 19:52:31', '2026-09-01 19:54:11', NULL);
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (11, 'LN-006', 16, '10000.00', '0.0000', 'flat', NULL, NULL, '2026-09-01 18:30:00', NULL, '0.00', '10000.00', 'active', NULL, NULL, 1, '2026-09-02 03:21:23', '2026-09-02 09:39:25', NULL);
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (12, 'LN-007', 17, '10000.00', '0.0000', 'flat', NULL, NULL, '2026-09-01 18:30:00', NULL, '0.00', '10000.00', 'completed', '2026-09-01 18:30:00', NULL, 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02', NULL);
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (13, 'LN-008', 17, '5000.00', '10.0000', 'flat', NULL, NULL, '2026-09-01 18:30:00', NULL, '500.00', '5500.00', 'completed', '2026-09-01 18:30:00', NULL, 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02', NULL);
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (14, 'LN-009', 17, '3000.00', '6.6667', 'flat', NULL, NULL, '2026-09-01 18:30:00', NULL, '200.00', '3200.00', 'completed', '2026-09-01 18:30:00', NULL, 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02', NULL);
INSERT INTO `loans` (`id`, `loan_id`, `borrower_id`, `principal_amount`, `interest_rate`, `interest_rate_type`, `tenure`, `tenure_unit`, `loan_given_date`, `due_date`, `total_expected_interest`, `total_expected_repayment`, `status`, `settlement_date`, `notes`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (15, 'LN-010', 17, '10000.00', '10.0000', 'monthly', NULL, NULL, '2026-07-03 18:30:00', '2026-08-02 18:30:00', '1000.00', '11000.00', 'overdue', NULL, NULL, 1, '2026-09-02 03:22:02', '2026-09-02 10:21:27', NULL);

-- Table structure for table `payment_allocations`
DROP TABLE IF EXISTS `payment_allocations`;
CREATE TABLE `payment_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `allocated_to` enum('principal','interest','late_fee','penalty') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `running_principal_balance` decimal(15,2) NOT NULL,
  `running_interest_balance` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_allocated_to` (`allocated_to`),
  CONSTRAINT `fk_allocations_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_allocation_amount_positive` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `payment_allocations`
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (4, 4, 'interest', '300.00', '10000.00', '0.00', '2026-09-01 21:11:24');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (5, 5, 'principal', '5000.00', '5000.00', '0.00', '2026-09-01 21:12:45');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (9, 9, 'principal', '4000.00', '6000.00', '300.00', '2026-09-02 03:21:23');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (10, 10, 'principal', '4000.00', '6000.00', '0.00', '2026-09-02 03:22:02');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (11, 11, 'principal', '6000.00', '0.00', '0.00', '2026-09-02 03:22:02');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (12, 12, 'interest', '500.00', '5000.00', '0.00', '2026-09-02 03:22:02');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (13, 12, 'principal', '5000.00', '0.00', '0.00', '2026-09-02 03:22:02');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (14, 13, 'interest', '200.00', '3000.00', '0.00', '2026-09-02 03:22:02');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `allocated_to`, `amount`, `running_principal_balance`, `running_interest_balance`, `created_at`) VALUES (15, 13, 'principal', '3000.00', '0.00', '0.00', '2026-09-02 03:22:02');

-- Table structure for table `payments`
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` int NOT NULL,
  `payment_date` date NOT NULL,
  `payment_amount` decimal(15,2) NOT NULL,
  `principal_portion` decimal(15,2) NOT NULL DEFAULT '0.00',
  `interest_portion` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_mode` enum('cash','upi','bank_transfer','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_void` tinyint(1) NOT NULL DEFAULT '0',
  `void_reason` text COLLATE utf8mb4_unicode_ci,
  `voided_at` timestamp NULL DEFAULT NULL,
  `voided_by` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id` (`payment_id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_loan_id` (`loan_id`),
  KEY `idx_payment_date` (`payment_date`),
  KEY `idx_is_void` (`is_void`),
  KEY `idx_created_by` (`created_by`),
  KEY `fk_payments_voided_by` (`voided_by`),
  CONSTRAINT `fk_payments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_loan` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_payment_amount_positive` CHECK ((`payment_amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `payments`
INSERT INTO `payments` (`id`, `payment_id`, `loan_id`, `payment_date`, `payment_amount`, `principal_portion`, `interest_portion`, `payment_mode`, `reference_number`, `notes`, `is_void`, `void_reason`, `voided_at`, `voided_by`, `created_by`, `created_at`, `updated_at`) VALUES (4, 'PAY-001', 2, '2026-08-31 18:30:00', '300.00', '0.00', '300.00', 'cash', NULL, NULL, 0, NULL, NULL, NULL, 1, '2026-09-01 21:11:24', '2026-09-01 21:11:24');
INSERT INTO `payments` (`id`, `payment_id`, `loan_id`, `payment_date`, `payment_amount`, `principal_portion`, `interest_portion`, `payment_mode`, `reference_number`, `notes`, `is_void`, `void_reason`, `voided_at`, `voided_by`, `created_by`, `created_at`, `updated_at`) VALUES (5, 'PAY-002', 2, '2026-08-31 18:30:00', '5000.00', '5000.00', '0.00', 'cash', 'test', NULL, 0, NULL, NULL, NULL, 1, '2026-09-01 21:12:45', '2026-09-01 21:12:45');
INSERT INTO `payments` (`id`, `payment_id`, `loan_id`, `payment_date`, `payment_amount`, `principal_portion`, `interest_portion`, `payment_mode`, `reference_number`, `notes`, `is_void`, `void_reason`, `voided_at`, `voided_by`, `created_by`, `created_at`, `updated_at`) VALUES (9, 'PAY-003', 11, '2026-09-01 18:30:00', '4000.00', '4000.00', '0.00', 'cash', NULL, NULL, 0, NULL, NULL, NULL, 1, '2026-09-02 03:21:23', '2026-09-02 03:21:23');
INSERT INTO `payments` (`id`, `payment_id`, `loan_id`, `payment_date`, `payment_amount`, `principal_portion`, `interest_portion`, `payment_mode`, `reference_number`, `notes`, `is_void`, `void_reason`, `voided_at`, `voided_by`, `created_by`, `created_at`, `updated_at`) VALUES (10, 'PAY-004', 12, '2026-09-01 18:30:00', '4000.00', '4000.00', '0.00', 'cash', NULL, NULL, 0, NULL, NULL, NULL, 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02');
INSERT INTO `payments` (`id`, `payment_id`, `loan_id`, `payment_date`, `payment_amount`, `principal_portion`, `interest_portion`, `payment_mode`, `reference_number`, `notes`, `is_void`, `void_reason`, `voided_at`, `voided_by`, `created_by`, `created_at`, `updated_at`) VALUES (11, 'PAY-005', 12, '2026-09-01 18:30:00', '6000.00', '6000.00', '0.00', 'cash', NULL, NULL, 0, NULL, NULL, NULL, 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02');
INSERT INTO `payments` (`id`, `payment_id`, `loan_id`, `payment_date`, `payment_amount`, `principal_portion`, `interest_portion`, `payment_mode`, `reference_number`, `notes`, `is_void`, `void_reason`, `voided_at`, `voided_by`, `created_by`, `created_at`, `updated_at`) VALUES (12, 'PAY-006', 13, '2026-09-01 18:30:00', '5500.00', '5000.00', '500.00', 'bank_transfer', NULL, NULL, 0, NULL, NULL, NULL, 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02');
INSERT INTO `payments` (`id`, `payment_id`, `loan_id`, `payment_date`, `payment_amount`, `principal_portion`, `interest_portion`, `payment_mode`, `reference_number`, `notes`, `is_void`, `void_reason`, `voided_at`, `voided_by`, `created_by`, `created_at`, `updated_at`) VALUES (13, 'PAY-007', 14, '2026-09-01 18:30:00', '3200.00', '3000.00', '200.00', 'bank_transfer', NULL, NULL, 0, NULL, NULL, NULL, 1, '2026-09-02 03:22:02', '2026-09-02 03:22:02');

-- Table structure for table `schema_migrations`
DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE `schema_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `batch` int NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `schema_migrations`
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (1, '001_create_users_table.sql', 1, '2026-09-01 18:15:51');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (2, '002_create_borrowers_table.sql', 1, '2026-09-01 18:15:51');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (3, '003_create_loans_table.sql', 1, '2026-09-01 18:15:51');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (4, '004_create_payments_table.sql', 1, '2026-09-01 18:15:52');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (5, '005_create_payment_allocations_table.sql', 1, '2026-09-01 18:15:52');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (6, '006_create_capital_transactions_table.sql', 1, '2026-09-01 18:15:52');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (7, '007_create_audit_logs_table.sql', 1, '2026-09-01 18:15:52');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (8, '008_create_settings_table.sql', 1, '2026-09-01 18:15:52');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (9, '009_insert_default_settings.sql', 1, '2026-09-01 18:15:52');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (10, '010_add_settlement_fields_to_loans.sql', 2, '2026-09-01 20:30:47');
INSERT INTO `schema_migrations` (`id`, `name`, `batch`, `applied_at`) VALUES (11, '011_make_tenure_and_duedate_nullable.sql', 3, '2026-09-01 20:42:54');

-- Table structure for table `settings`
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_setting_key` (`setting_key`),
  KEY `fk_settings_updated_by` (`updated_by`),
  CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=274 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `settings`
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (1, 'payment_allocation_method', 'principal_first', 'string', 'How payments are allocated: principal_first, interest_first, proportional', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (2, 'interest_calculation_type', 'monthly', 'string', 'Default interest calculation method (monthly, daily_prorated, flat)', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (3, 'currency_symbol', '₹', 'string', 'Currency symbol', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (4, 'currency_format', 'INR', 'string', 'Currency code', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (5, 'date_format', 'DD-MMM-YYYY', 'string', 'Date display format', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (6, 'enable_overdue_interest', 'false', 'boolean', 'Whether to charge interest on overdue amount', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (7, 'grace_period_days', '0', 'number', 'Days before overdue is triggered', 1, '2026-09-02 07:09:03');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (8, 'loan_id_prefix', 'LN', 'string', 'Prefix for loan IDs', 1, '2026-09-02 07:07:41');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (9, 'payment_id_prefix', 'PAY', 'string', 'Prefix for payment IDs', 1, '2026-09-02 07:07:41');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (10, 'capital_id_prefix', 'CAP', 'string', 'Prefix for capital transaction IDs', 1, '2026-09-02 07:07:41');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (11, 'borrower_id_prefix', 'BOR', 'string', 'Prefix for borrower IDs', 1, '2026-09-02 07:07:41');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (12, 'app_name', 'SmartLend Manager', 'string', 'Application display name', 1, '2026-09-02 07:09:02');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (13, 'company_name', 'Rags Capital Group', 'string', 'Registered business/company name', 1, '2026-09-02 07:09:03');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (14, 'default_interest_rate', '3', 'number', 'Default monthly interest rate percentage', 1, '2026-09-02 07:09:03');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (26, 'company_phone', '+917059480293', 'string', 'Business contact phone number', 1, '2026-09-02 07:09:03');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (27, 'company_email', 'support@smartlend.local', 'string', 'Support/contact email address', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (28, 'company_address', '4, GOPI KRISHNA PAL LANE', 'string', 'Physical office address', 1, '2026-09-02 07:09:03');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (29, 'tax_number', 'GSTIN27AAAAA0000A1Z5', 'string', 'Business Tax / GST Number', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (33, 'timezone', 'Asia/Kolkata', 'string', 'Primary timezone', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (39, 'default_tenure', '12', 'number', 'Default loan tenure duration', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (40, 'default_tenure_unit', 'months', 'string', 'Default tenure unit: days, weeks, months, years', 1, '2026-09-02 07:07:40');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (45, 'overdue_alert_days', '7', 'number', 'Threshold days to trigger overdue warning badges', 1, '2026-09-02 07:07:41');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (46, 'send_email_alerts', 'false', 'boolean', 'Toggle automated email notifications', 1, '2026-09-02 07:07:41');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (47, 'auto_logout_minutes', '60', 'number', 'Session inactivity timeout in minutes', 1, '2026-09-02 07:07:41');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`, `updated_at`) VALUES (48, 'enable_audit_logging', 'true', 'boolean', 'Record changes in system audit logs', 1, '2026-09-02 07:07:41');

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','operator','viewer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operator',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `last_login_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (1, 'admin@loanmanagement.com', '$2a$10$4gDSEBjtl/svp2863cYeDOPeiNA28T.Gi27Yqh3slK.ff5rvKecPW', 'System Administrator', 'admin', 1, '2026-09-02 04:06:32', '2026-09-01 18:15:53', '2026-09-02 07:07:40', NULL);

SET FOREIGN_KEY_CHECKS=1;
