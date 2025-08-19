-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 19, 2025 at 07:17 AM
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
  `income` decimal(8,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`client_ID`, `last_name`, `first_name`, `middle_name`, `marital_status`, `gender`, `date_of_birth`, `city`, `barangay`, `postal_code`, `street_address`, `phone_number`, `email`, `employment_status`, `occupation`, `years_in_job`, `income`, `created_at`) VALUES
(0, 'Mallari', 'Angel', 'Laurence P', 'single', 'male', '2025-08-22', 'tarlac', 'sanroque', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', '', '', 0, 1000.00, '2025-08-17 17:51:47');

-- --------------------------------------------------------

--
-- Table structure for table `client_loan`
--

CREATE TABLE `client_loan` (
  `loan_ID` bigint(20) NOT NULL,
  `loan_amount` decimal(8,2) NOT NULL,
  `interest_rate` decimal(4,2) NOT NULL,
  `payment_frequency` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `duration_of_payment` int(11) NOT NULL,
  `client_ID` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client_requirements`
--

CREATE TABLE `client_requirements` (
  `requirements_ID` int(11) NOT NULL,
  `has_valid_id` tinyint(1) DEFAULT 0,
  `has_barangay_clearance` tinyint(1) DEFAULT 0,
  `has_cr` tinyint(1) DEFAULT 0,
  `client_ID` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `client_requirements`
--

INSERT INTO `client_requirements` (`requirements_ID`, `has_valid_id`, `has_barangay_clearance`, `has_cr`, `client_ID`) VALUES
(0, 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `guarantor`
--

CREATE TABLE `guarantor` (
  `guarantor_ID` bigint(20) NOT NULL,
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
  `income` decimal(8,2) NOT NULL,
  `client_ID` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guarantor`
--

INSERT INTO `guarantor` (`guarantor_ID`, `last_name`, `first_name`, `middle_name`, `marital_status`, `gender`, `date_of_birth`, `city`, `barangay`, `postal_code`, `street_address`, `phone_number`, `email`, `employment_status`, `occupation`, `years_in_job`, `income`, `client_ID`) VALUES
(0, 'Mallari', 'Angel', 'Laurence P', 'single', 'female', '2025-08-28', 'tarlac', 'sanroque', '2300', '#205 Alvindia Segundo Tarlac City', '09212271315', 'laurence030703@gmail.com', '', '', 0, 1000.00, 0);

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
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
