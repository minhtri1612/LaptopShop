-- Initial database setup
-- This file runs when the MySQL container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS nodejspro;
USE nodejspro;

-- Set timezone
SET time_zone = '+00:00';