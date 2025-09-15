-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 15, 2025 at 03:15 PM
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
(202500001, 'Mallari', 'Angel', 'Laurence P', 'Married', 'Male', '1988-10-25', 'Tarlac City', 'Aguso', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', 'Student', '', 0, '0 - 5,000', '2025-09-09 15:38:44'),
(202500002, 'Mallari', 'Angel', 'Laurence P', 'Divorced', 'Non-binary', '1995-10-09', 'Tarlac City', 'Armenia', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', '', '', 0, '5,000 - 10,000', '2025-09-09 15:43:24'),
(202500003, 'Mallari', 'Angel', 'Laurence P', 'Divorced', 'Male', '1998-03-11', 'Tarlac City', 'Alvindia', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', '', '', 0, '20,000+', '2025-09-09 15:44:38'),
(202500004, 'Mallari', 'Angel', 'Laurence P', 'Divorced', 'Male', '1998-07-14', 'Tarlac City', 'Amucao', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', '', '', 0, '5,000 - 10,000', '2025-09-14 14:08:34');

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
('Tax Identification Number (TIN) ID', 0, 202500001, '2025-09-09 23:38:44'),
('Tax Identification Number (TIN) ID', 0, 202500002, '2025-09-09 23:43:24'),
('Social Security System (SSS) ID', 0, 202500003, '2025-09-09 23:44:38'),
('Social Security System (SSS) ID', 0, 202500004, '2025-09-14 22:08:34');

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
(1, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900001, 202500001, '2025-09-10 01:00:44'),
(2, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900002, 202500003, '2025-09-10 01:02:39'),
(3, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900003, 202500003, '2025-09-10 01:03:02'),
(4, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900001, 202500003, '2025-09-10 01:07:15'),
(5, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900002, 202500003, '2025-09-10 01:09:52'),
(6, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900003, 202500003, '2025-09-10 01:09:53'),
(7, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900004, 202500003, '2025-09-10 01:09:55'),
(8, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900005, 202500003, '2025-09-10 01:09:55'),
(9, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900006, 202500003, '2025-09-10 01:09:55'),
(10, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900007, 202500003, '2025-09-10 01:09:55'),
(11, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900008, 202500003, '2025-09-10 01:09:55'),
(12, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900009, 202500003, '2025-09-10 01:09:56'),
(13, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900010, 202500003, '2025-09-10 01:09:56'),
(14, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900011, 202500003, '2025-09-10 01:09:56'),
(15, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900012, 202500003, '2025-09-10 01:09:56'),
(16, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900013, 202500003, '2025-09-10 01:09:57'),
(17, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900014, 202500003, '2025-09-10 01:09:58'),
(18, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 2025090900015, 202500003, '2025-09-10 01:11:23'),
(19, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '12312312312', 202500001, 202500002, '2025-09-10 01:33:53'),
(20, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09628785256', 202500002, 202500001, '2025-09-10 01:35:56'),
(21, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09628785256', 202500001, 202500004, '2025-09-14 22:09:03'),
(22, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09628785256', 202500002, 202500004, '2025-09-14 22:10:10'),
(23, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 202500003, 202500001, '2025-09-15 20:38:53');

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
('I202050001', 20, 'activated', '2025-08-31');

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
(202500001, 'motor', 25000.00, 'monthly', '2018-06-21', '100 days', 20, '2018-09-29', 202500004, 'approved', 'Unpaid', '2025-09-14 22:09:03'),
(202500002, 'motor', 20000.00, 'monthly', '2025-09-15', '100 days', 20, '2025-12-24', 202500004, 'approved', 'Unpaid', '2025-09-14 22:10:10'),
(202500003, 'motor', 30000.00, 'monthly', '2025-09-16', '100 days', 20, '2025-12-25', 202500001, 'approved', 'Unpaid', '2025-09-15 20:38:53');

-- --------------------------------------------------------

--
-- Table structure for table `loan_reconstruct`
--

CREATE TABLE `loan_reconstruct` (
  `loan_reconstruct_id` int(20) NOT NULL,
  `loan_application_id` bigint(20) NOT NULL,
  `reconstruct_amount` decimal(10,2) NOT NULL,
  `payment_frequency` varchar(50) NOT NULL,
  `interest_rate` int(11) NOT NULL,
  `date_start` date NOT NULL,
  `duration` varchar(100) NOT NULL,
  `date_end` date NOT NULL
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
  `loan_application_id` bigint(20) NOT NULL,
  `client_id` bigint(20) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `date_payed` timestamp NOT NULL DEFAULT current_timestamp(),
  `processby` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `loan_application_id`, `client_id`, `amount_paid`, `date_payed`, `processby`) VALUES
(1, 202500001, 202500004, 2322.00, '2025-09-15 12:26:23', 'system'),
(2, 202500001, 202500004, 3321.00, '2025-09-15 12:26:34', 'system'),
(3, 202500001, 202500004, 4357.00, '2025-09-15 12:33:26', 'system');

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
(1, 'Angel Laurence Paras Mallari', 'laurence030703@gmail.com', 'admin', '12345678', 'Admin', '2025-08-25 10:45:49');

--
-- Indexes for dumped tables
--

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
  ADD KEY `loan_application_id` (`loan_application_id`) USING BTREE;

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
-- AUTO_INCREMENT for table `genders`
--
ALTER TABLE `genders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `guarantor`
--
ALTER TABLE `guarantor`
  MODIFY `guarantor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `income_salaries`
--
ALTER TABLE `income_salaries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `loan_reconstruct`
--
ALTER TABLE `loan_reconstruct`
  MODIFY `loan_reconstruct_id` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marital_statuses`
--
ALTER TABLE `marital_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

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
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`loan_application_id`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`client_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
