-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 24, 2025 at 08:41 PM
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
(202500001, 'Mallari', 'Angel', 'Laurence P', 'single', 'male', '2025-08-20', 'tarlac', 'sanroque', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', 'Student', 'n/a', 1, '0 - 5,000', '2025-08-19 16:10:56'),
(202500002, 'Mallari', 'Laurence', 'Paras', 'single', 'male', '2025-08-20', 'tarlac', 'sanroque', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', 'Student', 'n/a', 12, '5,000 - 10,000', '2025-08-24 14:36:42'),
(202500003, 'Landingin', 'Nigel', 'G', 'married', 'male', '2018-03-08', 'tarlac', 'sanroque', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', '', '', '', 0, '0 - 5,000', '2025-08-24 14:37:34');

-- --------------------------------------------------------

--
-- Table structure for table `client_requirements`
--

CREATE TABLE `client_requirements` (
  `has_valid_id` tinyint(1) DEFAULT 0,
  `has_barangay_clearance` tinyint(1) DEFAULT 0,
  `has_cr` varchar(150) DEFAULT '0',
  `client_ID` bigint(20) NOT NULL,
  `created_at` text DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `client_requirements`
--

INSERT INTO `client_requirements` (`has_valid_id`, `has_barangay_clearance`, `has_cr`, `client_ID`, `created_at`) VALUES
(1, 1, '0', 202500001, '2025-08-24 22:35:41'),
(1, 1, '0', 202500002, '2025-08-24 22:36:42'),
(1, 0, '0', 202500003, '2025-08-24 22:37:34');

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
  `loan_application_id` int(11) DEFAULT NULL,
  `client_ID` bigint(20) DEFAULT NULL,
  `created_at` text DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guarantor`
--

INSERT INTO `guarantor` (`guarantor_id`, `guarantor_last_name`, `guarantor_first_name`, `guarantor_middle_name`, `guarantor_street_address`, `guarantor_phone_number`, `loan_application_id`, `client_ID`, `created_at`) VALUES
(3, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 8, 202500001, '2025-08-24 22:35:06'),
(5, 'Mallari', 'Angel', 'Laurence P', '#205 Alvindia Segundo Tarlac City', '09212271315', 12, 202500003, '2025-08-24 22:46:31');

-- --------------------------------------------------------

--
-- Table structure for table `loan_applications`
--

CREATE TABLE `loan_applications` (
  `loan_application_id` int(11) NOT NULL,
  `loan_amount` decimal(10,2) NOT NULL,
  `payment_frequency` varchar(50) NOT NULL,
  `date_start` date NOT NULL,
  `duration_of_loan` varchar(50) NOT NULL,
  `date_end` date NOT NULL,
  `client_ID` bigint(20) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `paid` tinyint(1) DEFAULT NULL,
  `created_at` text DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`loan_application_id`, `loan_amount`, `payment_frequency`, `date_start`, `duration_of_loan`, `date_end`, `client_ID`, `status`, `paid`, `created_at`) VALUES
(8, 10000.00, 'daily', '2025-08-27', '100', '2025-12-05', 202500001, 'pending', NULL, '2025-08-24 22:32:06'),
(12, 15000.00, 'weekly', '2025-08-14', '100', '2025-11-22', 202500003, 'pending', 0, '2025-08-24 22:46:31');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'admin', '1', '2025-08-04 17:59:07');

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
-- Indexes for table `guarantor`
--
ALTER TABLE `guarantor`
  ADD PRIMARY KEY (`guarantor_id`),
  ADD KEY `loan_application_id` (`loan_application_id`);

--
-- Indexes for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD PRIMARY KEY (`loan_application_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `guarantor`
--
ALTER TABLE `guarantor`
  MODIFY `guarantor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `loan_applications`
--
ALTER TABLE `loan_applications`
  MODIFY `loan_application_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `guarantor`
--
ALTER TABLE `guarantor`
  ADD CONSTRAINT `guarantor_ibfk_1` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`loan_application_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
