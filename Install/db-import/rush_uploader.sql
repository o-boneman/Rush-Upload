-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 12/01/2024 às 00:23
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Check if the table exists
DROP TABLE IF EXISTS `tbl-images`;

-- Create the table
CREATE TABLE `tbl-images` (
  `img-id` int(11) NOT NULL,
  `img-path` varchar(255) NOT NULL,
  `img-data-id` int(11) NOT NULL,
  `img-user-id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `tbl-images`
--
ALTER TABLE `tbl-images`
  ADD PRIMARY KEY (`img-id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `tbl-images`
--
ALTER TABLE `tbl-images`
  MODIFY `img-id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;
