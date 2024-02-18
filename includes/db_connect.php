<?php

if (!defined('ACCESS_ALLOWED')) {
  http_response_code(403); // Forbidden
  echo json_encode(array("message" => "Direct access is not allowed."));
  exit;
}

require_once('includes/constants.php');

$host = DB_HOST; 
$username = DB_USERNAME; 
$password = DB_PASSWORD; 
$dbname = DB_NAME; 

// Create a connection
$conn = mysqli_connect($host, $username, $password, $dbname);

// Check connection
if (!$conn) {
  die("Connection failed: " . mysqli_connect_error());
}
?>