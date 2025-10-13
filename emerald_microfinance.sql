-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 13, 2025 at 09:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `emerald_microfinance`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `target_table` varchar(100) DEFAULT NULL,
  `target_id` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `before_state` text DEFAULT NULL,
  `after_state` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`log_id`, `user_id`, `action`, `description`, `target_table`, `target_id`, `ip_address`, `before_state`, `after_state`, `created_at`) VALUES
(1, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:11'),
(2, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:15'),
(3, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:19'),
(4, 1, 'VIEW', 'Selected client \"Angel Laurence Paras Mallari\" (ID: 202500001) to view ledger.', 'clients', '202500001', '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: LedgersView.html?client_id=202500001', '2025-10-11 04:26:20'),
(5, 1, 'VIEW', 'Opened Loan Detail Modal for Loan ID: 10202500001.', 'loan_applications', '10202500001', '::1', NULL, NULL, '2025-10-11 04:26:21'),
(6, 1, 'VIEW', 'Closed Loan Detail Modal via outside click.', 'UI_ACTION', 'loanDetailModal', '::1', NULL, NULL, '2025-10-11 04:26:22'),
(7, 1, 'NAVIGATION', 'Executed \'returnToLedgers\' function, redirecting to Ledgers.html', 'NAVIGATION', 'Ledgers.html', '::1', NULL, NULL, '2025-10-11 04:26:23'),
(8, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: AccountsReceivable.html', '2025-10-11 04:26:24'),
(9, 1, 'NAVIGATION', 'RESTRUCTURE button clicked for Loan ID 10202500001. Redirecting to reconstruct page.', 'loan_applications', '10202500001', '::1', NULL, NULL, '2025-10-11 04:26:26'),
(10, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 10202500001. Redirecting to payment page.', 'loan_applications', '10202500001', '::1', NULL, NULL, '2025-10-11 04:26:30'),
(11, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500001', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:31'),
(12, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:33'),
(13, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', '', '', '::1', '', '', '2025-10-11 04:26:36'),
(14, 1, 'VIEWED', 'Opened Client Search Modal.', 'clients', NULL, '::1', NULL, NULL, '2025-10-11 04:26:38'),
(15, 1, 'VIEWED', 'Fetched Interest Rate: 20%', 'interest_pecent', NULL, '::1', NULL, NULL, '2025-10-11 04:26:38'),
(16, 1, 'VIEWED', 'Closed Client Selection Modal.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:40'),
(17, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:42'),
(18, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 04:26:44'),
(19, 1, 'VIEW', 'FAILED: Clicked report button \"Due Payments\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 05:01:45'),
(20, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:01:32'),
(21, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 10202500001. Redirecting to payment page.', 'loan_applications', '10202500001', '::1', NULL, NULL, '2025-10-11 06:01:35'),
(22, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500001', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:01:35'),
(23, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:17:11'),
(24, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 10202500001. Redirecting to payment page.', 'loan_applications', '10202500001', '::1', NULL, NULL, '2025-10-11 06:17:14'),
(25, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500001', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:17:14'),
(26, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:17:45'),
(27, 1, 'VIEWED', 'Opened Client Search Modal.', 'clients', NULL, '::1', NULL, NULL, '2025-10-11 06:17:47'),
(28, 1, 'VIEWED', 'Fetched Interest Rate: 20%', 'interest_pecent', NULL, '::1', NULL, NULL, '2025-10-11 06:17:47'),
(29, 1, 'UPDATED', 'Selected Client ID 202500001 (Angel Laurence Paras Mallari) for loan application.', 'clients', '202500001', '::1', '{\"clientID\":\"\",\"clientName\":\"\"}', '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\"}', '2025-10-11 06:17:48'),
(30, 1, 'CREATED', 'Attempting submission for Client ID: 202500001. Target: loan_applications (202500001)', 'loan_applications', '202500001', '::1', NULL, NULL, '2025-10-11 06:18:02'),
(31, 1, 'CREATED', 'Loan application successfully created. Loan ID: 10202500002. Client ID: 202500001.', 'loan_applications', '10202500002', '::1', NULL, '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\",\"colateral\":\"Single Motor(Rusi 125)\",\"guarantorLastName\":\"Mallari\",\"guarantorFirstName\":\"Angel Laurence\",\"guarantorMiddleName\":\"Paras\",\"guarantorStreetAddress\":\"#205 Alvindia Segundo Tarlac City\",\"guarantorPhoneNumber\":\"09212271315\",\"loan-amount\":30000,\"payment-frequency\":\"daily\",\"date-start\":\"2025-10-01\",\"duration-of-loan\":\"100 days\",\"date-end\":\"2026-01-09\",\"interest-rate\":20,\"loanID\":\"10202500002\"}', '2025-10-11 06:18:02'),
(32, 1, 'VIEWED', 'Opened Loan Details Modal for Loan ID: 10202500002. Target: loan_applications (10202500002)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:18:02'),
(33, 1, 'VIEWED', 'Closed Loan Details Modal for Loan ID: 10202500002', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:18:04'),
(34, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:18:05'),
(35, 1, 'UPDATE', 'Loan Application Status changed to \'APPROVED\'', 'loan_applications', '10202500002', '::1', 'status: pending', 'status: approved', '2025-10-11 06:18:09'),
(36, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-11 06:18:10'),
(37, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:18:11'),
(38, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: Reports.html', '2025-10-11 06:18:12'),
(39, 1, 'VIEW', 'Viewed Report: Existing Clients (ReportsExistingClient.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:18:14'),
(40, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsOverduePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:18:15'),
(41, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:18:16'),
(42, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:22:49'),
(43, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-11 06:22:50'),
(44, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:22:50'),
(45, 1, 'VIEWED', 'Opened Client Search Modal.', 'clients', NULL, '::1', NULL, NULL, '2025-10-11 06:22:52'),
(46, 1, 'VIEWED', 'Fetched Interest Rate: 20%', 'interest_pecent', NULL, '::1', NULL, NULL, '2025-10-11 06:22:52'),
(47, 1, 'UPDATED', 'Selected Client ID 202500001 (Angel Laurence Paras Mallari) for loan application.', 'clients', '202500001', '::1', '{\"clientID\":\"\",\"clientName\":\"\"}', '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\"}', '2025-10-11 06:22:53'),
(48, 1, 'CREATED', 'Attempting submission for Client ID: 202500001. Target: loan_applications (202500001)', 'loan_applications', '202500001', '::1', NULL, NULL, '2025-10-11 06:23:03'),
(49, 1, 'VIEWED', 'Opened Loan Details Modal for Loan ID: 10202500003. Target: loan_applications (10202500003)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:23:03'),
(50, 1, 'CREATED', 'Loan application successfully created. Loan ID: 10202500003. Client ID: 202500001.', 'loan_applications', '10202500003', '::1', NULL, '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\",\"colateral\":\"motor\",\"guarantorLastName\":\"Jake\",\"guarantorFirstName\":\"Syrus\",\"guarantorMiddleName\":\"Pars\",\"guarantorStreetAddress\":\"balibago block 2\",\"guarantorPhoneNumber\":\"12312312312\",\"loan-amount\":30000,\"payment-frequency\":\"weekly\",\"date-start\":\"2025-10-23\",\"duration-of-loan\":\"100 days\",\"date-end\":\"2026-01-31\",\"interest-rate\":20,\"loanID\":\"10202500003\"}', '2025-10-11 06:23:03'),
(51, 1, 'VIEWED', 'Closed Loan Details Modal for Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:23:04'),
(52, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:23:06'),
(53, 1, 'UPDATE', 'Loan Application Status changed to \'APPROVED\'', 'loan_applications', '10202500003', '::1', 'status: pending', 'status: approved', '2025-10-11 06:23:11'),
(54, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-11 06:23:12'),
(55, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:23:23'),
(56, 1, 'VIEW', 'Viewed Report: Existing Clients (ReportsExistingClient.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:23:24'),
(57, 1, 'VIEW', 'Accessed detailed view for Client ID: 202500001', 'clients', '202500001', '::1', NULL, NULL, '2025-10-11 06:23:25'),
(58, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsOverduePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:23:27'),
(59, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:23:28'),
(60, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500001', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:42:45'),
(61, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:42:56'),
(62, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 10202500003. Redirecting to payment page.', 'loan_applications', '10202500003', '::1', NULL, NULL, '2025-10-11 06:43:01'),
(63, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:43:01'),
(64, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:47:11'),
(65, 1, 'FILTER', 'Applied due date filter: 2025-10-24', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:47:16'),
(66, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:47:16'),
(67, 1, 'FILTER', 'Applied due date filter: 2025-10-29', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:47:22'),
(68, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:47:22'),
(69, 1, 'FILTER', 'Applied due date filter: 2025-11-01', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:47:36'),
(70, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:47:36'),
(71, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:49:34'),
(72, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:22'),
(73, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:35'),
(74, 1, 'FILTER', 'Applied filters: Date=2025-10-16, Status=All', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:38'),
(75, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:38'),
(76, 1, 'FILTER', 'Applied filters: Date=2025-10-16, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:41'),
(77, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:41'),
(78, 1, 'FILTER', 'Applied filters: Date=2025-10-16, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:44'),
(79, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:44'),
(80, 1, 'FILTER', 'Applied filters: Date=2025-10-16, Status=Overdue', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:47'),
(81, 1, 'REPORT_DATA', 'Loaded Due Payments Report with 0 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:47'),
(82, 1, 'FILTER', 'Applied filters: Date=2025-11-06, Status=Overdue', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:51'),
(83, 1, 'REPORT_DATA', 'Loaded Due Payments Report with 0 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:51'),
(84, 1, 'FILTER', 'Applied filters: Date=2025-11-06, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:54'),
(85, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:50:54'),
(86, 1, 'FILTER', 'Applied filters: Date=2025-11-06, Status=All', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:51:12'),
(87, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:51:12'),
(88, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:52:47'),
(89, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-11 06:53:01'),
(90, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:54:45'),
(91, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:54:46'),
(92, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:54:49'),
(93, 1, 'VIEW', 'FAILED: Clicked report button \"Due Payments\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:54:52'),
(94, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:54:52'),
(95, 1, 'FILTER', 'Applied filters: Date=2025-10-24, Status=All', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:55:04'),
(96, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:55:04'),
(97, 1, 'FILTER', 'Applied filters: Date=2025-10-24, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:55:06'),
(98, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:55:06'),
(99, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:55:58'),
(100, 1, 'FILTER', 'Applied filters: Date=None, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:03'),
(101, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:03'),
(102, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:36'),
(103, 1, 'FILTER', 'Applied filters: Date=None, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:39'),
(104, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:39'),
(105, 1, 'FILTER', 'Applied filters: Date=None, Status=Overdue', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:46'),
(106, 1, 'REPORT_DATA', 'Loaded Due Payments Report with 0 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:46'),
(107, 1, 'FILTER', 'Applied filters: Date=2025-10-31, Status=Overdue', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:51'),
(108, 1, 'REPORT_DATA', 'Loaded Due Payments Report with 0 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:56:51'),
(109, 1, 'FILTER', 'Applied filters: Date=2025-12-02, Status=Overdue', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:01'),
(110, 1, 'REPORT_DATA', 'Loaded Due Payments Report with 0 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:01'),
(111, 1, 'FILTER', 'Applied filters: Date=2025-12-02, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:03'),
(112, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:03'),
(113, 1, 'FILTER', 'Applied filters: Date=2025-12-02, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:07'),
(114, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:07'),
(115, 1, 'FILTER', 'Applied filters: Date=2026-01-01, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:19'),
(116, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:19'),
(117, 1, 'FILTER', 'Applied filters: Date=2026-01-01, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:23'),
(118, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:23'),
(119, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:57:57'),
(120, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 10:58:10'),
(121, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 12:58:19'),
(122, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 12:58:19'),
(123, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 12:58:20'),
(124, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 12:58:21'),
(125, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 12:58:22'),
(126, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:00:34'),
(127, 1, 'FILTER', 'Applied filters: Date=None, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:00:37'),
(128, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:00:37'),
(129, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:01:16'),
(130, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:21'),
(131, 1, 'FILTER', 'Cleared all filters.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:22'),
(132, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:22'),
(133, 1, 'FILTER', 'Cleared all filters.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:25'),
(134, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:25'),
(135, 1, 'FILTER', 'Applied filters: Date=None, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:27'),
(136, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:27'),
(137, 1, 'FILTER', 'Cleared all filters.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:29'),
(138, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:07:29'),
(139, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:08:46'),
(140, 1, 'FILTER', 'Applied filters: Date=2025-10-22, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:08:53'),
(141, 1, 'VIEW', 'Viewed Due: 2025-10-22 (Due Today)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:08:53'),
(142, 1, 'REPORT_DATA', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:08:53'),
(143, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:10:42'),
(144, 1, 'FILTER', 'Cleared all filters.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:10:44'),
(145, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:10:44'),
(146, 1, 'FILTER', 'Applied filters: Date=2025-10-15, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:11:08'),
(147, 1, 'VIEW', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:11:08'),
(148, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:11:54'),
(149, 1, 'VIEW', 'Applied filters: Date=2025-10-16, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:12:00'),
(150, 1, 'VIEW', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:12:00'),
(151, 1, 'VIEW', 'Applied filters: Date=2025-10-16, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:12:03'),
(152, 1, 'VIEW', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:12:03'),
(153, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsOverduePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:12:21'),
(154, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:17:26'),
(155, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsOverduePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:20:12'),
(156, 1, 'VIEW', 'Viewed Report: Existing Clients (ReportsExistingClient.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:20:13'),
(157, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:20:15'),
(158, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:20:15'),
(159, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:35:47'),
(160, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 13:35:47'),
(161, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:10:03'),
(162, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:12'),
(163, 1, 'VIEW', 'Applied filters: Date=None, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:19'),
(164, 1, 'VIEW', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:19'),
(165, 1, 'VIEW', 'Applied filters: Date=2025-10-15, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:23'),
(166, 1, 'VIEW', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:24'),
(167, 1, 'VIEW', 'Applied filters: Date=2025-10-15, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:26'),
(168, 1, 'VIEW', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:26'),
(169, 1, 'VIEW', 'Applied filters: Date=2025-10-18, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:34'),
(170, 1, 'VIEW', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:11:34'),
(171, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:14:37'),
(172, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:26'),
(173, 1, 'VIEW', 'Applied filters: Date=None, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:31'),
(174, 1, 'VIEW', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:31'),
(175, 1, 'LOGOUT', 'User logged out.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:33'),
(176, 1, 'User logged out: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:33'),
(177, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:39'),
(178, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:57'),
(179, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:15:58'),
(180, 1, 'VIEW', 'FAILED: Clicked report button \"Due Payments\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:24:30'),
(181, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:24:30'),
(182, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:24:34'),
(183, 1, 'VIEW', 'FAILED: Clicked report button \"Due Payments\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:24:36'),
(184, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:24:36'),
(185, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:25:21'),
(186, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:39:10'),
(187, 1, 'VIEW', 'Applied filters: Date=2025-10-27, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:39:18'),
(188, 1, 'VIEW', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:39:18'),
(189, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:39:23'),
(190, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:39:23'),
(191, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:39:23'),
(192, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:39:24'),
(193, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:48:23'),
(194, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:49:16'),
(195, 1, 'VIEW', 'Applied filters: Date=2025-10-15, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:49:23'),
(196, 1, 'VIEW', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:49:23'),
(197, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:49:52'),
(198, 1, 'VIEW', 'Applied filters: Date=2025-10-15, Status=Upcoming', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:49:57'),
(199, 1, 'VIEW', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:49:57'),
(200, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:50:03'),
(201, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:50:36'),
(202, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:50:37'),
(203, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:50:37'),
(204, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:50:37'),
(205, 1, 'VIEW', 'Applied filters: Date=2025-10-15, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:50:42'),
(206, 1, 'VIEW', 'Successfully loaded Due Payments Report with 2 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:50:42'),
(207, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:51:06'),
(208, 1, 'EXPORT', 'Exported Due Payments Report to CSV.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:51:08'),
(209, 1, 'VIEW', 'Applied filters: Date=2025-10-23, Status=Due Today', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:51:31'),
(210, 1, 'VIEW', 'Successfully loaded Due Payments Report with 1 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:51:31'),
(211, 1, 'EXPORT', 'Exported Due Payments Report to CSV.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:51:32'),
(212, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:52:29'),
(213, 1, 'CREATE', 'Exported Due Payments Report to CSV.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:52:31'),
(214, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:52:54'),
(215, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 14:53:41'),
(216, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:02:13'),
(217, 1, 'NAVIGATION', 'FAILED: Clicked tool \"Interest Amount\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:02:20'),
(218, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:02:24'),
(219, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:03:14'),
(220, 1, 'NAVIGATION', 'FAILED: Clicked tool \"Interest Amount\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:03:16'),
(221, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:03:28'),
(222, 1, 'NAVIGATION', 'FAILED: Clicked tool \"Interest Amount\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:03:31'),
(223, 1, 'NAVIGATION', 'FAILED: Clicked tool \"Interest Amount\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:03:59'),
(224, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:04:01'),
(225, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:04:07'),
(226, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:04:08'),
(227, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:04:31'),
(228, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:04:32'),
(229, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:04:33'),
(230, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:05:31'),
(231, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:25:55'),
(232, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:33:28'),
(233, 1, 'NAVIGATION', 'Clicked \"Client Creation\" link, redirecting to ClientCreationForm.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:33:41'),
(234, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:33:42'),
(235, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-12 15:33:43'),
(236, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:33:44'),
(237, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: UserManagement.html', '2025-10-12 15:33:44'),
(238, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:33:47'),
(239, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:33:48'),
(240, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 15:38:50'),
(241, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 16:59:43'),
(242, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 16:59:44'),
(243, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:02:30'),
(244, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:02:31'),
(245, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:02:36'),
(246, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:04:39'),
(247, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:04:43'),
(248, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:07:47'),
(249, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:07:49'),
(250, 1, 'TOOL_ACTION', 'Initiated **Database Backup** for database: emerald_microfinance.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:10:56'),
(251, 1, 'CREATED', 'Initiated **Database Backup** for database: emerald_microfinance.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:12:23'),
(252, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:12:30'),
(253, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:13:59'),
(254, 1, 'VIEW', 'Viewed Report: Existing Clients (ReportsExistingClient.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:14:20'),
(255, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsOverduePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:14:21'),
(256, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:14:24'),
(257, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:14:29'),
(258, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:14:31'),
(259, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:14:32'),
(260, 1, 'CREATED', 'Initiated **Database Backup** for database: emerald_microfinance.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:16:58'),
(261, 1, 'CREATED', 'Initiated **Manual Database Backup** for database: emerald_microfinance.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:17:08'),
(262, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:20:12'),
(263, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:20:14'),
(264, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:24:06'),
(265, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:24:07'),
(266, 1, 'CREATED_BR', 'Initiated **Manual Database Backup** for database: emerald_microfinance.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:31:13'),
(267, 1, 'CREATED_BR', 'Initiated **Manual Database Backup** for database: emerald_microfinance.', NULL, NULL, '::1', NULL, NULL, '2025-10-12 18:46:49'),
(268, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:43:12'),
(269, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:43:14'),
(270, 1, 'CREATED_BR', 'Initiated **Manual Database Backup** for database: emerald_microfinance.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:43:19'),
(271, 1, 'UPDATED_BR', 'Successfully completed  **Manual Database Restore** using file: emerald_microfinance_2025-10-13_06-43-19.sql.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:43:30'),
(272, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:05'),
(273, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:08'),
(274, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:09'),
(275, 1, 'VIEW', 'Viewed Report: Existing Clients (ReportsExistingClient.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:10'),
(276, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:30'),
(277, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:34'),
(278, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:36'),
(279, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 04:44:37'),
(280, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: Reports.html', '2025-10-13 04:44:38'),
(281, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 05:45:58'),
(282, 1, 'NAVIGATION', 'Password Change button clicked, redirecting to UserPasswordChange.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 05:49:48'),
(283, 1, 'NAVIGATION', 'Username Change button clicked, redirecting to UserUsernameChange.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 05:49:50'),
(284, 1, 'NAVIGATION', 'Account Creation button clicked, redirecting to UserCreation.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 05:49:51'),
(285, 1, 'NAVIGATION', 'Existing Accounts button clicked, redirecting to UserExisting.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 05:49:52'),
(286, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 05:52:32'),
(287, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 05:52:33'),
(288, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:02:54'),
(289, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsOverduePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:02:55'),
(290, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsOverduePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:02:57'),
(291, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsDelinquentAccounts.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:03:16'),
(292, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsDelinquentAccounts.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:04:17'),
(293, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:36'),
(294, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:37'),
(295, 1, 'NAVIGATION', 'Accessed tool \"City/ Barangays\", loading page ToolsPlaces.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:38'),
(296, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:39'),
(297, 1, 'NAVIGATION', 'Accessed tool \"Backup And Restore\", loading page ToolsBR.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:40'),
(298, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:42'),
(299, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:48'),
(300, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:13:58'),
(301, 1, 'NAVIGATION', 'Password Change button clicked, redirecting to UserPasswordChange.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:14:00'),
(302, 1, 'NAVIGATION', 'Existing Accounts button clicked, redirecting to UserExisting.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:14:03'),
(303, 1, 'NAVIGATION', 'Username Change button clicked, redirecting to UserUsernameChange.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:17:16'),
(304, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:57:47'),
(305, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:57:49'),
(306, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:57:50'),
(307, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:57:51'),
(308, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:57:57'),
(309, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsDelinquentAccounts.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:57:58'),
(310, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:58:27'),
(311, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:58:27'),
(312, 1, 'VIEW', 'Viewed Report: Delinquent Accounts (ReportsDelinquentAccounts.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:58:29'),
(313, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:58:30'),
(314, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 06:58:30'),
(315, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:15'),
(316, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:17'),
(317, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-13 07:00:18'),
(318, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 10202500003. Redirecting to payment page.', 'loan_applications', '10202500003', '::1', NULL, NULL, '2025-10-13 07:00:27'),
(319, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:27'),
(320, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"36000.00\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:29'),
(321, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:29'),
(322, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"33428.57\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:30'),
(323, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:30'),
(324, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"30857.14\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:30'),
(325, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:30'),
(326, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"28285.71\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:31'),
(327, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:31'),
(328, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"25714.28\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:31'),
(329, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:31'),
(330, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"23142.85\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:31'),
(331, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:31'),
(332, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"20571.42\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:31'),
(333, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:31'),
(334, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"17999.99\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:32'),
(335, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:32'),
(336, 1, 'PAYMENT', 'Successfully processed payment of 2571.43 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"17999.99\",\"amountToPay\":\"2571.43\",\"paymentAmount\":\"2571.43\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"2571.43\"}', '2025-10-13 07:00:32');
INSERT INTO `audit_logs` (`log_id`, `user_id`, `action`, `description`, `target_table`, `target_id`, `ip_address`, `before_state`, `after_state`, `created_at`) VALUES
(337, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:32'),
(338, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:34'),
(339, 1, 'NAVIGATION', 'RESTRUCTURE button clicked for Loan ID 10202500003. Redirecting to reconstruct page.', 'loan_applications', '10202500003', '::1', NULL, NULL, '2025-10-13 07:00:37'),
(340, 1, 'UPDATE', 'Reconstructed Loan ID: 10202500003. New terms: Freq:weekly, Duration:100 days', 'loans', '10202500003', '::1', NULL, NULL, '2025-10-13 07:00:45'),
(341, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:00:47'),
(342, 1, 'VIEW', 'Selected client \"Angel Laurence Paras Mallari\" (ID: 202500001) to view ledger.', 'clients', '202500001', '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: LedgersView.html?client_id=202500001', '2025-10-13 07:00:48'),
(343, 1, 'VIEW', 'Opened Loan Detail Modal for Loan ID: 10202500003.', 'loan_applications', '10202500003', '::1', NULL, NULL, '2025-10-13 07:00:49'),
(344, 1, 'VIEW', 'Closed Loan Detail Modal via outside click.', 'UI_ACTION', 'loanDetailModal', '::1', NULL, NULL, '2025-10-13 07:00:56'),
(345, 1, 'NAVIGATION', 'Mapsd from Ledgers View to Ledger page.', 'NAVIGATION', 'Ledgers.html', '::1', NULL, NULL, '2025-10-13 07:00:56'),
(346, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: AccountsReceivable.html', '2025-10-13 07:00:58'),
(347, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 10202500003. Redirecting to payment page.', 'loan_reconstruct', '100001102025', '::1', NULL, NULL, '2025-10-13 07:01:02'),
(348, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:02'),
(349, 1, 'PAYMENT', 'Successfully processed payment of 1102.04 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"15428.56\",\"amountToPay\":\"1102.04\",\"paymentAmount\":\"1102.04\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"1102.04\"}', '2025-10-13 07:01:07'),
(350, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:07'),
(351, 1, 'PAYMENT', 'Successfully processed payment of 1102.04 for Client ID: 202500001, Loan ID: 10202500003.', 'payment', '10202500003', '::1', '{\"loanId\":\"10202500003\",\"clientId\":\"202500001\",\"balance\":\"14326.52\",\"amountToPay\":\"1102.04\",\"paymentAmount\":\"1102.04\"}', '{\"message\":\"Payment recorded successfully.\",\"amount\":\"1102.04\"}', '2025-10-13 07:01:11'),
(352, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:11'),
(353, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:18'),
(354, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:19'),
(355, 1, 'VIEW', 'Selected client \"Angel Laurence Paras Mallari\" (ID: 202500001) to view ledger.', 'clients', '202500001', '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: LedgersView.html?client_id=202500001', '2025-10-13 07:01:20'),
(356, 1, 'VIEW', 'Opened Loan Detail Modal for Loan ID: 10202500003.', 'loan_applications', '10202500003', '::1', NULL, NULL, '2025-10-13 07:01:21'),
(357, 1, 'VIEW', 'Closed Loan Detail Modal via outside click.', 'UI_ACTION', 'loanDetailModal', '::1', NULL, NULL, '2025-10-13 07:01:34'),
(358, 1, 'NAVIGATION', 'Mapsd from Ledgers View to Reports page.', 'NAVIGATION', 'Reports.html', '::1', NULL, NULL, '2025-10-13 07:01:35'),
(359, 1, 'VIEW', 'Viewed Report: Existing Clients (ReportsExistingClient.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:36'),
(360, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:38'),
(361, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:01:40'),
(362, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-13 07:01:42'),
(363, 1, 'NAVIGATION', 'RESTRUCTURE button clicked for Loan ID 10202500003. Redirecting to reconstruct page.', 'loan_reconstruct', '100001102025', '::1', NULL, NULL, '2025-10-13 07:01:45'),
(364, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:02:35'),
(365, 1, 'NAVIGATION', 'RESTRUCTURE button clicked for Loan ID 10202500003. Redirecting to reconstruct page.', 'loan_reconstruct', '100001102025', '::1', NULL, NULL, '2025-10-13 07:03:57'),
(366, 1, 'PAGE_LOAD', 'Initial page load complete. Triggering session check.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:04:06'),
(367, 1, 'NAVIGATION', 'RESTRUCTURE button clicked for Loan ID 10202500003. Redirecting to reconstruct page.', 'loan_reconstruct', '100001102025', '::1', NULL, NULL, '2025-10-13 07:05:12'),
(368, 1, 'RETURN_BUTTON_CLICK', 'User clicked RETURN button, redirecting to AccountsReceivable.html.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:10:29'),
(369, 1, 'RETURN_BUTTON_CLICK', 'User clicked RETURN button, redirecting to AccountsReceivable.html.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:10:32'),
(370, 1, 'NAVIGATION', 'RESTRUCTURE button clicked for Loan ID 10202500002. Redirecting to reconstruct page.', 'loan_applications', '10202500002', '::1', NULL, NULL, '2025-10-13 07:10:45'),
(371, 1, 'NAVIGATION', 'User clicked RETURN button, redirecting to AccountsReceivable.html.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:12:15'),
(372, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 10202500003. Redirecting to payment page.', 'loan_reconstruct', '100001102025', '::1', NULL, NULL, '2025-10-13 07:12:18'),
(373, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 10202500003', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:12:18'),
(374, 1, 'NAVIGATION', 'User clicked RETURN button, redirecting to AccountsReceivable.html.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:12:20'),
(375, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:12:49'),
(376, 1, 'VIEW', 'Selected client \"Angel Laurence Paras Mallari\" (ID: 202500001) to view ledger.', 'clients', '202500001', '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: LedgersView.html?client_id=202500001', '2025-10-13 07:12:50'),
(377, 1, 'NAVIGATION', 'Executed \'returnToLedgers\' function, redirecting to Ledgers.html', 'NAVIGATION', 'Ledgers.html', '::1', NULL, NULL, '2025-10-13 07:12:52'),
(378, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: Reports.html', '2025-10-13 07:12:56'),
(379, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:12:57'),
(380, 1, 'NAVIGATION', 'Clicked \"Client Creation\" link, redirecting to ClientCreationForm.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:12:59'),
(381, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:13:00'),
(382, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', '', '', '::1', '', '', '2025-10-13 07:13:02'),
(383, 1, 'VIEWED', 'Opened Client Search Modal.', 'clients', NULL, '::1', NULL, NULL, '2025-10-13 07:13:04'),
(384, 1, 'VIEWED', 'Fetched Interest Rate: 20%', 'interest_pecent', NULL, '::1', NULL, NULL, '2025-10-13 07:13:04'),
(385, 1, 'UPDATED', 'Selected Client ID 202500001 (Angel Laurence Paras Mallari) for loan application.', 'clients', '202500001', '::1', '{\"clientID\":\"\",\"clientName\":\"\"}', '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\"}', '2025-10-13 07:13:05'),
(386, 1, 'CREATED', 'Attempting submission for Client ID: 202500001. Target: loan_applications (202500001)', 'loan_applications', '202500001', '::1', NULL, NULL, '2025-10-13 07:13:15'),
(387, 1, 'VIEWED', 'Opened Loan Details Modal for Loan ID: 10202500004. Target: loan_applications (10202500004)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:13:15'),
(388, 1, 'CREATED', 'Loan application successfully created. Loan ID: 10202500004. Client ID: 202500001.', 'loan_applications', '10202500004', '::1', NULL, '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\",\"colateral\":\"Single Motor(Rusi 125)\",\"guarantorLastName\":\"Mallari\",\"guarantorFirstName\":\"Angel Laurence\",\"guarantorMiddleName\":\"Paras\",\"guarantorStreetAddress\":\"#205 Alvindia Segundo Tarlac City\",\"guarantorPhoneNumber\":\"09212271315\",\"loan-amount\":30000,\"payment-frequency\":\"monthly\",\"date-start\":\"2025-10-30\",\"duration-of-loan\":\"100 days\",\"date-end\":\"2026-02-07\",\"interest-rate\":20,\"loanID\":\"10202500004\"}', '2025-10-13 07:13:15'),
(389, 1, 'VIEWED', 'Closed Loan Details Modal for Loan ID: 10202500004', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:13:20'),
(390, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:13:23'),
(391, 1, 'VIEW', 'Viewed Client Profile for Client ID: 202500001', 'clients', '202500001', '::1', '', '', '2025-10-13 07:13:25'),
(392, 1, 'NAVIGATION', 'User clicked RETURN button, redirecting to AccountsReceivable.html.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:14:30'),
(393, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:14:44'),
(394, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:14:45'),
(395, 1, 'VIEW', 'Viewed Client Profile for Client ID: 202500001', 'clients', '202500001', '::1', '', '', '2025-10-13 07:15:03'),
(396, 1, 'NAVIGATION', 'User clicked RETURN button, redirecting to PendingAccount.html.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:15:06'),
(397, 1, 'VIEW', 'Viewed Client Profile for Client ID: 202500001', 'clients', '202500001', '::1', '', '', '2025-10-13 07:16:31'),
(398, 1, 'NAVIGATION', 'User clicked RETURN button, redirecting to PendingAccount.html.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:17:53'),
(399, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-13 07:17:55'),
(400, 1, 'NAVIGATION', 'Clicked \"Ledger\" link, redirecting to Ledgers.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:17:55'),
(401, 1, 'VIEW', 'Selected client \"Angel Laurence Paras Mallari\" (ID: 202500001) to view ledger.', 'clients', '202500001', '::1', 'From URL: /Emerald-Microfinance/Ledgers.html', 'To URL: LedgersView.html?client_id=202500001', '2025-10-13 07:17:57'),
(402, 1, 'NAVIGATION', 'Mapsd from Ledgers View to Reports page.', 'NAVIGATION', 'Reports.html', '::1', NULL, NULL, '2025-10-13 07:17:58'),
(403, 1, 'VIEW', 'Viewed Report: Due Payments (ReportsDuePayments.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:18:00'),
(404, 1, 'VIEW', 'Successfully loaded Due Payments Report with 3 records.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:18:00'),
(405, 1, 'VIEW', 'Viewed Report: Audit Trail (ReportsAuditTrail.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:18:02'),
(406, 1, 'VIEW', 'FAILED: Clicked report button \"Existing Clients\" with no mapped page.', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:18:04'),
(407, 1, 'VIEW', 'Accessed detailed view for Client ID: 202500001', 'clients', '202500001', '::1', NULL, NULL, '2025-10-13 07:18:05'),
(408, 1, 'VIEW', 'Viewed Report: Existing Clients (ReportsExistingClient.html)', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:18:09'),
(409, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:18:11'),
(410, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 07:18:12'),
(411, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:07:47'),
(412, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:07:49'),
(413, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:07:50'),
(414, 1, 'NAVIGATION', 'Clicked \"Tools\" link, redirecting to Tools.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:07:50'),
(415, 1, 'NAVIGATION', 'Accessed tool \"Interest Amount\", loading page ToolsInterest.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:07:52'),
(416, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:45:15'),
(417, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', '', '', '::1', '', '', '2025-10-13 17:45:16'),
(418, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:45:17'),
(419, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:45:18'),
(420, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:45:44'),
(421, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:48:26'),
(422, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:51:58'),
(423, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:52:31'),
(425, 1, 'User logged in successfully: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:55:04'),
(426, 1, 'User logged out: admin', '', NULL, NULL, '::1', NULL, NULL, '2025-10-13 17:55:05');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `client_ID` bigint(20) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) NOT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `gender` varchar(30) NOT NULL,
  `date_of_birth` date NOT NULL,
  `city` varchar(100) NOT NULL,
  `barangay` varchar(100) NOT NULL,
  `postal_code` varchar(4) NOT NULL,
  `street_address` varchar(255) NOT NULL,
  `phone_number` varchar(30) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `employment_status` varchar(50) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `years_in_job` int(11) DEFAULT NULL,
  `income` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`client_ID`, `last_name`, `first_name`, `middle_name`, `marital_status`, `gender`, `date_of_birth`, `city`, `barangay`, `postal_code`, `street_address`, `phone_number`, `email`, `employment_status`, `occupation`, `years_in_job`, `income`, `created_at`) VALUES
(202500001, 'Mallari', 'Angel Laurence', 'Paras', 'Divorced', 'Female', '2001-07-11', 'Tarlac City', 'Amucao', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', '', '', 0, '0 - 5,000', '2025-10-10 16:41:17');

-- --------------------------------------------------------

--
-- Table structure for table `client_requirements`
--

CREATE TABLE `client_requirements` (
  `has_valid_id` varchar(50) DEFAULT '0',
  `has_barangay_clearance` tinyint(1) DEFAULT 0,
  `client_ID` bigint(20) NOT NULL,
  `created_at` text DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `client_requirements`
--

INSERT INTO `client_requirements` (`has_valid_id`, `has_barangay_clearance`, `client_ID`, `created_at`) VALUES
('Postal ID', 0, 202500001, '2025-10-11 00:41:17');

-- --------------------------------------------------------

--
-- Table structure for table `genders`
--

CREATE TABLE `genders` (
  `id` int(11) NOT NULL,
  `gender_type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `genders`
--

INSERT INTO `genders` (`id`, `gender_type`) VALUES
(2, 'Female'),
(1, 'Male'),
(3, 'Non-binary'),
(4, 'Other');

-- --------------------------------------------------------

--
-- Table structure for table `guarantor`
--

CREATE TABLE `guarantor` (
  `guarantor_id` int(11) NOT NULL,
  `guarantor_last_name` varchar(255) NOT NULL,
  `guarantor_first_name` varchar(255) NOT NULL,
  `guarantor_middle_name` varchar(255) DEFAULT NULL,
  `guarantor_street_address` varchar(255) NOT NULL,
  `guarantor_phone_number` varchar(20) NOT NULL,
  `loan_application_id` bigint(20) NOT NULL,
  `client_ID` bigint(20) DEFAULT NULL,
  `created_at` text DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guarantor`
--

INSERT INTO `guarantor` (`guarantor_id`, `guarantor_last_name`, `guarantor_first_name`, `guarantor_middle_name`, `guarantor_street_address`, `guarantor_phone_number`, `loan_application_id`, `client_ID`, `created_at`) VALUES
(1, 'Mallari', 'Angel Laurence', 'Paras', '#205 Alvindia Segundo Tarlac City', '09212271315', 10202500001, 202500001, '2025-10-11 00:41:32'),
(2, 'Mallari', 'Angel Laurence', 'Paras', '#205 Alvindia Segundo Tarlac City', '09212271315', 10202500002, 202500001, '2025-10-11 14:18:02'),
(3, 'Jake', 'Syrus', 'Pars', 'balibago block 2', '12312312312', 10202500003, 202500001, '2025-10-11 14:23:03'),
(4, 'Mallari', 'Angel Laurence', 'Paras', '#205 Alvindia Segundo Tarlac City', '09212271315', 10202500004, 202500001, '2025-10-13 15:13:15');

-- --------------------------------------------------------

--
-- Table structure for table `income_salaries`
--

CREATE TABLE `income_salaries` (
  `id` int(11) NOT NULL,
  `income_range` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `income_salaries`
--

INSERT INTO `income_salaries` (`id`, `income_range`) VALUES
(1, '0 - 5,000'),
(3, '10,000 - 20,000'),
(4, '20,000+'),
(2, '5,000 - 10,000');

-- --------------------------------------------------------

--
-- Table structure for table `interest_pecent`
--

CREATE TABLE `interest_pecent` (
  `interest_ID` varchar(11) NOT NULL,
  `Interest_Pecent` int(11) NOT NULL,
  `status` varchar(11) NOT NULL,
  `date_created` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interest_pecent`
--

INSERT INTO `interest_pecent` (`interest_ID`, `Interest_Pecent`, `status`, `date_created`) VALUES
('I20250001', 20, 'deactivated', '2025-10-06'),
('I20250002', 21, 'deactivated', '2025-10-06'),
('I20250003', 2, 'deactivated', '2025-10-06'),
('I20250004', 20, 'deactivated', '2025-10-06'),
('I20250001', 20, 'deactivated', '2025-10-06'),
('I20250002', 21, 'deactivated', '2025-10-06'),
('I20250003', 2, 'deactivated', '2025-10-06'),
('I20250004', 20, 'deactivated', '2025-10-06'),
('I20250005', 21, 'deactivated', '2025-10-14'),
('I20250006', 20, 'deactivated', '2025-10-14'),
('I20250007', 22, 'deactivated', '2025-10-14'),
('I20250008', 12, 'deactivated', '2025-10-14'),
('I20250009', 20, 'activated', '2025-10-14');

-- --------------------------------------------------------

--
-- Table structure for table `loan_applications`
--

CREATE TABLE `loan_applications` (
  `loan_application_id` bigint(20) NOT NULL,
  `colateral` varchar(150) NOT NULL,
  `loan_amount` decimal(10,2) NOT NULL,
  `payment_frequency` varchar(50) NOT NULL,
  `date_start` date NOT NULL,
  `duration_of_loan` varchar(50) NOT NULL,
  `interest_rate` int(11) NOT NULL DEFAULT 0,
  `date_end` date NOT NULL,
  `client_ID` bigint(20) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `paid` varchar(25) DEFAULT NULL,
  `created_at` text DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`loan_application_id`, `colateral`, `loan_amount`, `payment_frequency`, `date_start`, `duration_of_loan`, `interest_rate`, `date_end`, `client_ID`, `status`, `paid`, `created_at`) VALUES
(10202500001, 'Single Motor(Rusi 125)', 25000.00, 'monthly', '2025-10-01', '100 days', 20, '2026-01-09', 202500001, 'approved', 'Unpaid', '2025-10-11 00:41:32'),
(10202500002, 'Single Motor(Rusi 125)', 30000.00, 'daily', '2025-10-01', '100 days', 20, '2026-01-09', 202500001, 'approved', 'Unpaid', '2025-10-11 14:18:02'),
(10202500003, 'motor', 30000.00, 'weekly', '2025-10-01', '100 days', 20, '2026-01-09', 202500001, 'approved', 'Unpaid', '2025-10-11 14:23:03'),
(10202500004, 'Single Motor(Rusi 125)', 30000.00, 'monthly', '2025-10-30', '100 days', 20, '2026-02-07', 202500001, 'Pending', 'Unpaid', '2025-10-13 15:13:15');

-- --------------------------------------------------------

--
-- Table structure for table `loan_reconstruct`
--

CREATE TABLE `loan_reconstruct` (
  `loan_reconstruct_id` varchar(20) NOT NULL,
  `loan_application_id` bigint(20) NOT NULL,
  `reconstruct_amount` decimal(10,2) NOT NULL,
  `payment_frequency` varchar(50) NOT NULL,
  `interest_rate` int(11) NOT NULL,
  `date_start` date NOT NULL,
  `duration` varchar(100) NOT NULL,
  `date_end` date NOT NULL,
  `status` varchar(25) NOT NULL,
  `date_created` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_reconstruct`
--

INSERT INTO `loan_reconstruct` (`loan_reconstruct_id`, `loan_application_id`, `reconstruct_amount`, `payment_frequency`, `interest_rate`, `date_start`, `duration`, `date_end`, `status`, `date_created`) VALUES
('100001102025', 10202500003, 12857.13, 'weekly', 20, '2025-10-14', '100 days', '2026-01-22', '1', '2025-10-13');

-- --------------------------------------------------------

--
-- Table structure for table `marital_statuses`
--

CREATE TABLE `marital_statuses` (
  `id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `marital_statuses`
--

INSERT INTO `marital_statuses` (`id`, `status`) VALUES
(3, 'Divorced'),
(1, 'Married'),
(2, 'Single'),
(4, 'Widowed');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `loan_reconstruct_id` varchar(20) DEFAULT NULL,
  `loan_application_id` bigint(20) NOT NULL,
  `client_id` bigint(20) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `date_payed` timestamp NOT NULL DEFAULT current_timestamp(),
  `processby` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `loan_reconstruct_id`, `loan_application_id`, `client_id`, `amount_paid`, `date_payed`, `processby`) VALUES
(1, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:29', 'system'),
(2, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:30', 'system'),
(3, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:30', 'system'),
(4, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:31', 'system'),
(5, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:31', 'system'),
(6, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:31', 'system'),
(7, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:31', 'system'),
(8, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:32', 'system'),
(9, NULL, 10202500003, 202500001, 2571.43, '2025-10-13 07:00:32', 'system'),
(10, '100001102025', 10202500003, 202500001, 1102.04, '2025-10-13 07:01:07', 'system'),
(11, '100001102025', 10202500003, 202500001, 1102.04, '2025-10-13 07:01:11', 'system');

-- --------------------------------------------------------

--
-- Table structure for table `philippine_barangays`
--

CREATE TABLE `philippine_barangays` (
  `id` int(11) NOT NULL,
  `barangay_name` varchar(100) NOT NULL,
  `city_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `philippine_barangays`
--

INSERT INTO `philippine_barangays` (`id`, `barangay_name`, `city_name`) VALUES
(1, 'Aguso', 'Tarlac City'),
(2, 'Alvindia', 'Tarlac City'),
(3, 'Amucao', 'Tarlac City'),
(4, 'Armenia', 'Tarlac City'),
(5, 'Azon', 'Tarlac City'),
(6, 'Balanti', 'Tarlac City'),
(7, 'Balete', 'Tarlac City'),
(8, 'Balibago I', 'Tarlac City'),
(9, 'Balibago II', 'Tarlac City'),
(10, 'Balingcanaway', 'Tarlac City'),
(11, 'Baras-Baras', 'Tarlac City'),
(12, 'Batang Batang', 'Tarlac City'),
(13, 'Bora', 'Tarlac City'),
(14, 'Buenavista', 'Tarlac City'),
(15, 'Buhilit', 'Tarlac City'),
(16, 'Burot', 'Tarlac City'),
(17, 'Cabayaoasan', 'Tarlac City'),
(18, 'Cairang', 'Tarlac City'),
(19, 'Calingcuan', 'Tarlac City'),
(20, 'Camp Servillano Aquino (C & S)', 'Tarlac City'),
(21, 'Carangian', 'Tarlac City'),
(22, 'Central', 'Tarlac City'),
(23, 'Cutcut I', 'Tarlac City'),
(24, 'Cutcut II', 'Tarlac City'),
(25, 'Dapdap', 'Tarlac City'),
(26, 'Dela Paz', 'Tarlac City'),
(27, 'Dolores', 'Tarlac City'),
(28, 'Dominante', 'Tarlac City'),
(29, 'Don Bosco', 'Tarlac City'),
(30, 'Dueño', 'Tarlac City'),
(31, 'Laoang', 'Tarlac City'),
(32, 'Ligtasan', 'Tarlac City'),
(33, 'Lipay-Dingin', 'Tarlac City'),
(36, 'Mabini', 'Tarlac City'),
(34, 'Maligaya', 'Tarlac City'),
(35, 'Maliwalo', 'Tarlac City'),
(37, 'Matatalaib', 'Tarlac City'),
(38, 'Mckinley', 'Tarlac City'),
(40, 'Pacquing', 'Tarlac City'),
(41, 'Paraiso', 'Tarlac City'),
(39, 'Parang', 'Tarlac City'),
(42, 'Pasonanca', 'Tarlac City'),
(43, 'Poblacion', 'Tarlac City'),
(45, 'Poblacion H', 'Tarlac City'),
(46, 'Poblacion I', 'Tarlac City'),
(47, 'Poblacion II', 'Tarlac City'),
(48, 'Poblacion III', 'Tarlac City'),
(49, 'Poblacion IV', 'Tarlac City'),
(54, 'Poblacion IX', 'Tarlac City'),
(44, 'Poblacion Matatalaib', 'Tarlac City'),
(50, 'Poblacion V', 'Tarlac City'),
(51, 'Poblacion VI', 'Tarlac City'),
(52, 'Poblacion VII', 'Tarlac City'),
(53, 'Poblacion VIII', 'Tarlac City'),
(55, 'Poblacion X', 'Tarlac City'),
(56, 'Poblacion XI', 'Tarlac City'),
(57, 'Poblacion XII', 'Tarlac City'),
(58, 'Poblacion XIII', 'Tarlac City'),
(59, 'Poblacion XIV', 'Tarlac City'),
(64, 'Poblacion XIX', 'Tarlac City'),
(60, 'Poblacion XV', 'Tarlac City'),
(61, 'Poblacion XVI', 'Tarlac City'),
(62, 'Poblacion XVII', 'Tarlac City'),
(63, 'Poblacion XVIII', 'Tarlac City'),
(65, 'Poblacion XX', 'Tarlac City'),
(66, 'Poblacion XXI', 'Tarlac City'),
(67, 'Poblacion XXII', 'Tarlac City'),
(68, 'Poblacion XXIII', 'Tarlac City'),
(69, 'Poblacion XXIV', 'Tarlac City'),
(74, 'Poblacion XXIX', 'Tarlac City'),
(70, 'Poblacion XXV', 'Tarlac City'),
(71, 'Poblacion XXVI', 'Tarlac City'),
(72, 'Poblacion XXVII', 'Tarlac City'),
(73, 'Poblacion XXVIII', 'Tarlac City'),
(75, 'Poblacion XXX', 'Tarlac City'),
(76, 'San Isidro', 'Tarlac City');

-- --------------------------------------------------------

--
-- Table structure for table `philippine_cities`
--

CREATE TABLE `philippine_cities` (
  `id` int(11) NOT NULL,
  `city_name` varchar(100) NOT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `philippine_cities`
--

INSERT INTO `philippine_cities` (`id`, `city_name`, `province`, `postal_code`) VALUES
(1, 'Tarlac City', 'Tarlac', '2300');

-- --------------------------------------------------------

--
-- Table structure for table `philippine_valid_ids`
--

CREATE TABLE `philippine_valid_ids` (
  `id` int(11) NOT NULL,
  `id_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `philippine_valid_ids`
--

INSERT INTO `philippine_valid_ids` (`id`, `id_name`, `description`) VALUES
(1, 'Passport', 'Philippine Passport issued by the Department of Foreign Affairs (DFA).'),
(2, 'Driver\'s License', 'Issued by the Land Transportation Office (LTO).'),
(3, 'Social Security System (SSS) ID', 'For private sector employees.'),
(4, 'Government Service Insurance System (GSIS) ID', 'For government employees.'),
(5, 'Unified Multi-Purpose ID (UMID)', 'A single ID card for SSS, GSIS, Pag-IBIG, and PhilHealth.'),
(6, 'Professional Regulation Commission (PRC) ID', 'For licensed professionals.'),
(7, 'Postal ID', 'An official identification card issued by the Philippine Postal Corporation (PhilPost).'),
(8, 'Voter\'s ID', 'Issued by the Commission on Elections (COMELEC).'),
(9, 'Tax Identification Number (TIN) ID', 'Issued by the Bureau of Internal Revenue (BIR).'),
(10, 'Philippine Health Insurance Corporation (PhilHealth) ID', 'For PhilHealth members.');

-- --------------------------------------------------------

--
-- Table structure for table `user_accounts`
--

CREATE TABLE `user_accounts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_accounts`
--

INSERT INTO `user_accounts` (`id`, `name`, `email`, `username`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Angel Laurence Paras Mallari', 'laurence030703@gmail.com', 'admin', '12345678', 'Admin', '2025-08-25 10:45:49'),
(2, 'Lebron James', 'LebronJames@gmail.com', 'Cashier', '1234567890', 'loan-officer', '2025-09-30 02:26:43');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `fk_audit_user` (`user_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`client_ID`);

--
-- Indexes for table `client_requirements`
--
ALTER TABLE `client_requirements`
  ADD PRIMARY KEY (`client_ID`);

--
-- Indexes for table `genders`
--
ALTER TABLE `genders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gender_type` (`gender_type`);

--
-- Indexes for table `guarantor`
--
ALTER TABLE `guarantor`
  ADD PRIMARY KEY (`guarantor_id`),
  ADD KEY `loan_application_id` (`loan_application_id`),
  ADD KEY `fk_guarantor_client_id` (`client_ID`);

--
-- Indexes for table `income_salaries`
--
ALTER TABLE `income_salaries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `income_range` (`income_range`);

--
-- Indexes for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD PRIMARY KEY (`loan_application_id`),
  ADD KEY `fk_loan_client_id` (`client_ID`);

--
-- Indexes for table `loan_reconstruct`
--
ALTER TABLE `loan_reconstruct`
  ADD PRIMARY KEY (`loan_reconstruct_id`),
  ADD KEY `fk_loan_reconstruct_application` (`loan_application_id`);

--
-- Indexes for table `marital_statuses`
--
ALTER TABLE `marital_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status` (`status`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `loan_application_id` (`loan_application_id`) USING BTREE,
  ADD KEY `fk_payment_loan_reconstruct` (`loan_reconstruct_id`);

--
-- Indexes for table `philippine_barangays`
--
ALTER TABLE `philippine_barangays`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `barangay_city_unique` (`barangay_name`,`city_name`);

--
-- Indexes for table `philippine_cities`
--
ALTER TABLE `philippine_cities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `city_name` (`city_name`);

--
-- Indexes for table `philippine_valid_ids`
--
ALTER TABLE `philippine_valid_ids`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_name` (`id_name`);

--
-- Indexes for table `user_accounts`
--
ALTER TABLE `user_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=427;

--
-- AUTO_INCREMENT for table `genders`
--
ALTER TABLE `genders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `guarantor`
--
ALTER TABLE `guarantor`
  MODIFY `guarantor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `income_salaries`
--
ALTER TABLE `income_salaries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `marital_statuses`
--
ALTER TABLE `marital_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `philippine_barangays`
--
ALTER TABLE `philippine_barangays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `philippine_cities`
--
ALTER TABLE `philippine_cities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `philippine_valid_ids`
--
ALTER TABLE `philippine_valid_ids`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_accounts`
--
ALTER TABLE `user_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `client_requirements`
--
ALTER TABLE `client_requirements`
  ADD CONSTRAINT `fk_client_requirements_client_id` FOREIGN KEY (`client_ID`) REFERENCES `clients` (`client_ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `guarantor`
--
ALTER TABLE `guarantor`
  ADD CONSTRAINT `fk_guarantor_client_id` FOREIGN KEY (`client_ID`) REFERENCES `clients` (`client_ID`);

--
-- Constraints for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD CONSTRAINT `fk_loan_client_id` FOREIGN KEY (`client_ID`) REFERENCES `clients` (`client_ID`);

--
-- Constraints for table `loan_reconstruct`
--
ALTER TABLE `loan_reconstruct`
  ADD CONSTRAINT `fk_loan_reconstruct_application` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`loan_application_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `fk_payment_loan_reconstruct` FOREIGN KEY (`loan_reconstruct_id`) REFERENCES `loan_reconstruct` (`loan_reconstruct_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`loan_application_id`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`client_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
