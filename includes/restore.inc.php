<?php

if (!defined('ACCESS_ALLOWED')) {
    http_response_code(403); // Forbidden
    echo json_encode(array("message" => "Direct access is not allowed."));
    exit;
}

// Ensuring the request method is POST for data security
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(array("message" => "Invalid request method."));
    exit;
}

// Fetching and decoding the JSON input
$json = file_get_contents("php://input");
$data = json_decode($json, true);

// Validating the input
if (empty($data["filename"])) {
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Missing required data."));
    exit;
}

$fileName = $data["filename"];

if (restoreOriginalImage($fileName)) {
    http_response_code(200);
    echo json_encode(array("message" => "Image restored successfully."));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Failed to restore image."));
}
