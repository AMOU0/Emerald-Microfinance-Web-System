-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2025 at 03:55 PM
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
(1, 1, 'CREATED', 'FAILED: Client creation failed due to missing required field: Employment Status.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:10'),
(2, 1, 'CREATED', 'FAILED: Client creation failed due to missing required field: Employment Status.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:22'),
(3, 1, 'CREATED', 'SUCCESS: Client created with ID: 202500001', 'clients', '202500001', '::1', NULL, NULL, '2025-11-11 03:59:26'),
(4, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:29'),
(5, 1, 'VIEWED', 'Opened Client Search Modal.', 'clients', NULL, '::1', NULL, NULL, '2025-11-11 03:59:30'),
(6, 1, 'VIEWED', 'Fetched Interest Rate: 20%', 'interest_pecent', NULL, '::1', NULL, NULL, '2025-11-11 03:59:30'),
(7, 1, 'UPDATED', 'Selected Client ID 202500001 (Angel Laurence Paras Mallari) for loan application.', 'clients', '202500001', '::1', '{\"clientID\":\"\",\"clientName\":\"\"}', '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\"}', '2025-11-11 03:59:31'),
(8, 1, 'CREATED', 'Attempting submission for Client ID: 202500001. Target: loan_applications (202500001)', 'loan_applications', '202500001', '::1', NULL, NULL, '2025-11-11 03:59:40'),
(9, 1, 'VIEWED', 'Opened Loan Details Modal for Loan ID: 11202500001. Target: loan_applications (11202500001)', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:40'),
(10, 1, 'CREATED', 'Loan application successfully created. Loan ID: 11202500001. Client ID: 202500001.', 'loan_applications', '11202500001', '::1', NULL, '{\"clientID\":\"202500001\",\"clientName\":\"Angel Laurence Paras Mallari\",\"colateral\":\"Single Motor(Rusi 125)\",\"guarantorLastName\":\"Mallari\",\"guarantorFirstName\":\"Angel Laurence\",\"guarantorMiddleName\":\"Paras\",\"guarantorStreetAddress\":\"#205 Alvindia Segundo Tarlac City\",\"guarantorPhoneNumber\":\"09212271315\",\"loan-amount\":5000,\"payment-frequency\":\"monthly\",\"date-start\":\"2025-11-19\",\"duration-of-loan\":\"100 days\",\"duration-in-periods\":\"3\",\"date-end\":\"2026-02-27\",\"interest-rate\":20,\"loanID\":\"11202500001\"}', '2025-11-11 03:59:40'),
(11, 1, 'VIEWED', 'Closed Loan Details Modal for Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:46'),
(12, 1, 'NAVIGATION', 'Clicked \"Pending Accounts\" link, redirecting to PendingAccount.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:47'),
(13, 1, 'UPDATE', 'Loan Application Status changed to \'APPROVED\' for ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:50'),
(14, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:51'),
(15, 1, 'DATA_FETCH', 'Fetching approved and unpaid accounts for collection.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:51'),
(16, 1, 'NAVIGATION', 'Clicked \"Reports\" link, redirecting to Reports.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:56'),
(17, 1, 'VIEW', 'Viewed Report: For Release (ReportsRelease.html)', NULL, NULL, '::1', NULL, NULL, '2025-11-11 03:59:57'),
(18, 1, 'RELEASE', 'Report Released for Client ID: 202500001 - Angel Laurence Mallari, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:01'),
(19, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:02'),
(20, 1, 'DATA_FETCH', 'Fetching approved and unpaid accounts for collection.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:02'),
(21, 1, 'NAVIGATION', 'Clicked \"Dashboard\" link, redirecting to DashBoard.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:03'),
(22, 1, 'NAVIGATION', 'Clicked dashboard tile:  For Release (Nov 18, 2025), redirecting to ReleasedLoan.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:04'),
(23, 1, 'NAVIGATION', 'Clicked \"Dashboard\" link, redirecting to DashBoard.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:08'),
(24, 1, 'NAVIGATION', 'Clicked dashboard tile: Collection Today, redirecting to CollectionToday.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:19'),
(25, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:22'),
(26, 1, 'DATA_FETCH', 'Fetching approved and unpaid accounts for collection.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:22'),
(27, 1, 'NAVIGATION', 'SELECT button clicked for Loan ID 11202500001. Redirecting to payment page.', 'loan_applications', '11202500001', '::1', NULL, NULL, '2025-11-11 04:00:25'),
(28, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:25'),
(29, 1, 'PAYMENT', 'Successfully processed payment of 2000.00 for Client ID: 202500001, Loan ID: 11202500001.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:26'),
(30, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:00:26'),
(31, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:08:19'),
(32, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:08:24'),
(33, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:08:24'),
(34, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:09:14'),
(35, 1, 'PAYMENT', 'Successfully processed payment of 2000.00 for Client ID: 202500001, Loan ID: 11202500001.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:09:15'),
(36, 1, 'VIEW', 'Successfully loaded loan details and schedule for Client ID: 202500001, Loan ID: 11202500001', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:09:15'),
(37, 1, 'NAVIGATION', 'Clicked \"Dashboard\" link, redirecting to DashBoard.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:09:28'),
(38, 1, 'NAVIGATION', 'Clicked dashboard tile: Collection Today, redirecting to CollectionToday.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 04:09:31'),
(39, 1, 'NAVIGATION', 'Clicked \"User Management\" link, redirecting to UserManagement.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 08:17:19'),
(40, 1, 'NAVIGATION', 'Clicked \"Dashboard\" link, redirecting to DashBoard.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 08:18:03'),
(41, 1, 'NAVIGATION', 'Clicked dashboard tile: Collection Today, redirecting to CollectionToday.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 08:18:03'),
(42, 1, 'NAVIGATION', 'Clicked \"Dashboard\" link, redirecting to DashBoard.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 08:18:07'),
(43, 1, 'NAVIGATION', 'Clicked \"Client Creation\" link, redirecting to ClientCreationForm.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 08:18:08'),
(44, 1, 'NAVIGATION', 'Clicked \"Dashboard\" link, redirecting to DashBoard.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 08:18:09'),
(45, 1, 'NAVIGATION', 'Clicked dashboard tile: Collection Today, redirecting to CollectionToday.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 12:15:23'),
(46, 1, 'NAVIGATION', 'Clicked \"Payment Collection\" link, redirecting to AccountsReceivable.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 14:46:10'),
(47, 1, 'DATA_FETCH', 'Fetching approved and unpaid accounts for collection.', NULL, NULL, '::1', NULL, NULL, '2025-11-11 14:46:10'),
(48, 1, 'NAVIGATION', 'Clicked \"Dashboard\" link, redirecting to DashBoard.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 14:46:12'),
(49, 1, 'NAVIGATION', 'Clicked dashboard tile: Collection Today, redirecting to CollectionToday.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 14:46:12'),
(50, 1, 'NAVIGATION', 'Clicked \"Client Creation\" link, redirecting to ClientCreationForm.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 14:53:41'),
(51, 1, 'NAVIGATION', 'Clicked \"Loan Application\" link, redirecting to LoanApplication.html', NULL, NULL, '::1', NULL, NULL, '2025-11-11 14:53:42');

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
  `street_address` varchar(255) NOT NULL,
  `phone_number` varchar(30) NOT NULL,
  `employment_status` varchar(50) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `years_in_job` int(11) DEFAULT NULL,
  `income` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`client_ID`, `last_name`, `first_name`, `middle_name`, `marital_status`, `gender`, `date_of_birth`, `city`, `barangay`, `street_address`, `phone_number`, `employment_status`, `occupation`, `years_in_job`, `income`, `created_at`) VALUES
(202500001, 'Mallari', 'Angel Laurence', 'Paras', 'Divorced', 'Female', '2003-11-11', 'Tarlac City', 'Alvindia', '#205 Alvindia Segundo Tarlac City', '09212271315', 'Employed', 'Player', 1, '5,000 - 10,000', '2025-11-11 03:59:25');

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
('Voter\'s ID', 1, 202500001, '2025-11-11 11:59:26');

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
(1, 'Mallari', 'Angel Laurence', 'Paras', '#205 Alvindia Segundo Tarlac City', '09212271315', 11202500001, 202500001, '2025-11-11 11:59:40');

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
('I20250009', 20, 'deactivated', '2025-10-14'),
('I20250010', 2, 'deactivated', '2025-10-16'),
('I20250011', 20, 'deactivated', '2025-10-16'),
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
('I20250009', 20, 'deactivated', '2025-10-14'),
('I20250010', 2, 'deactivated', '2025-10-16'),
('I20250011', 20, 'deactivated', '2025-10-16'),
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
('I20250009', 20, 'deactivated', '2025-10-14'),
('I20250010', 2, 'deactivated', '2025-10-16'),
('I20250011', 20, 'deactivated', '2025-10-16'),
('I20250012', 10, 'deactivated', '2025-10-28'),
('I20250013', 20, 'activated', '2025-11-02');

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
  `release_status` varchar(50) DEFAULT NULL,
  `paid` varchar(25) DEFAULT NULL,
  `created_at` text DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`loan_application_id`, `colateral`, `loan_amount`, `payment_frequency`, `date_start`, `duration_of_loan`, `interest_rate`, `date_end`, `client_ID`, `status`, `release_status`, `paid`, `created_at`) VALUES
(11202500001, 'Single Motor(Rusi 125)', 5000.00, 'monthly', '2025-11-11', '100 days', 20, '2026-02-19', 202500001, 'approved', 'Released', 'Unpaid', '2025-11-11 11:59:40');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(25) NOT NULL,
  `date_created` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, NULL, 11202500001, 202500001, 2000.00, '2025-11-11 04:00:26', 'Angel Laurence Paras Mallari'),
(2, NULL, 11202500001, 202500001, 2000.00, '2025-11-11 04:09:15', 'Angel Laurence Paras Mallari');

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
(4, 'Philippine Identification Card (PhilID)', 'PhilID'),
(5, 'Unified Multi-Purpose ID (UMID)', 'A single ID card for SSS, GSIS, Pag-IBIG, and PhilHealth.'),
(6, 'Voter\'s ID', 'Issued by the Commission on Elections (COMELEC).');

-- --------------------------------------------------------

--
-- Table structure for table `released`
--

CREATE TABLE `released` (
  `release_id` bigint(20) NOT NULL,
  `client_ID` bigint(20) NOT NULL,
  `loan_application_id` bigint(20) NOT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `released`
--

INSERT INTO `released` (`release_id`, `client_ID`, `loan_application_id`, `created_at`) VALUES
(1, 202500001, 11202500001, '2025-11-11');

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
  `status` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_accounts`
--

INSERT INTO `user_accounts` (`id`, `name`, `email`, `username`, `password_hash`, `role`, `status`, `created_at`) VALUES
(1, 'Angel Laurence Paras Mallari', 'laurence030703@gmail.com', 'admin', '$2y$10$LIliztEFwp.cFJA9AuSub.7NnwfL/IqRcwvMjGx2kSGzUI1IoKLs6', 'Admin', 'Active', '2025-10-16 10:43:36'),
(22, 'Kerby Reyes', 'laurence0307s03@gmail.com', 'Kerby', '$2y$10$ic7WNirPhuVwKvUV8tyiI.wr9fTYRcIzy3/fnYMYE2XeV6YTyBKqq', 'Manager', 'Active', '2025-10-23 17:11:58'),
(23, 'Akol Joseph', 'asdasdasd@gmail.com', 'Akol', '$2y$10$Alq77WDN7/6ti4MRf9aFwO/fsn/QR0s2g7OnRMOqokZ.G86emCAJq', 'Loan_Officer', 'Active', '2025-10-23 17:12:26');

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
  ADD KEY `fk_guarantor_client_id` (`client_ID`),
  ADD KEY `loan_application_id_2` (`loan_application_id`);

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
-- Indexes for table `released`
--
ALTER TABLE `released`
  ADD PRIMARY KEY (`release_id`),
  ADD KEY `fk_released_client_id` (`client_ID`),
  ADD KEY `fk_released_loan_application` (`loan_application_id`);

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
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `genders`
--
ALTER TABLE `genders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `guarantor`
--
ALTER TABLE `guarantor`
  MODIFY `guarantor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT for table `released`
--
ALTER TABLE `released`
  MODIFY `release_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_accounts`
--
ALTER TABLE `user_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

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
  ADD CONSTRAINT `fk_guarantor_client_id` FOREIGN KEY (`client_ID`) REFERENCES `clients` (`client_ID`),
  ADD CONSTRAINT `fk_guarantor_loan_application` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`loan_application_id`) ON DELETE CASCADE ON UPDATE CASCADE;

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

--
-- Constraints for table `released`
--
ALTER TABLE `released`
  ADD CONSTRAINT `fk_released_client_id` FOREIGN KEY (`client_ID`) REFERENCES `clients` (`client_ID`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_released_loan_application` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`loan_application_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
