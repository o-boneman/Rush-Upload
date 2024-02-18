<?php
if (!defined('ACCESS_ALLOWED')) {
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "Direct access is not allowed."]);
    exit;
}

// Check for the correct request method and content type
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SERVER['CONTENT_TYPE']) || $_SERVER['CONTENT_TYPE'] !== 'application/json') {
    http_response_code(400);
    echo json_encode(["message" => "Invalid request method or content type."]);
    exit;
}

// Get and decode the JSON input
$json = file_get_contents("php://input");
$data = json_decode($json, true);

// Validate required data
if (empty($data["oldServerFileName"]) || empty($data["data"])) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required data."]);
    exit;
}

// Get and sanitize variables
$oldServerFileName = sanitizeFileName($data["oldServerFileName"]);
$filePath = UPLOAD_DIR . $oldServerFileName;
$dataURL = $data["data"];

// Validate file path
if (!isValidFilePath($filePath)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid file path."]);
    exit;
}

// Delete the old image file
deleteOldImageFile($oldServerFileName);

// Process and save the new image
$result = processAndSaveImage($dataURL, $oldServerFileName);

if ($result['success']) {
    http_response_code(200);
    echo json_encode(["message" => "Image updated successfully.", "filename" => $result['filename']]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to update image. Reason: " . $result['error']]);
}
