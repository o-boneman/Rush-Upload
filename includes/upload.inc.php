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
if (empty($data["name"]) || empty($data["type"]) || empty($data["data"])) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required data. [Debugger code: 01]"]);
    exit;
}

// Retrieve the data-id sent from JavaScript
$name = $data["name"];
$type = $data["type"];
$dataURL = $data["data"];
$dataId = $data["dataId"]; 

$userId = 1; // You may replace this with the actual user ID

// Sanitize and validate the filename
$sanitizedFileName = preg_replace("/[^a-zA-Z0-9_.-]/", "", $name);
if (strlen($sanitizedFileName) === 0) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid filename"]);
    exit;
}

$extension = pathinfo($sanitizedFileName, PATHINFO_EXTENSION);
if (preg_match("/[^a-zA-Z0-9]/", $extension)) {
    // Extension contains invalid characters
    http_response_code(400);
    echo json_encode(["message" => "Invalid file extension"]);
    exit;
}

// Check for null bytes in the filename
if (strpos($sanitizedFileName, "\0") !== false) {
    http_response_code(400);
    echo json_encode(["message" => "Null byte in file name"]);
    exit;
}

$fileName = generateUniqueFileName($sanitizedFileName, $userId);
$filePath = UPLOAD_DIR . $fileName;

// Remove data URI prefix and replace spaces
$dataURL = preg_replace('/^data:image\/(jpeg|png);base64,/i', '', $dataURL);
$dataURL = str_replace(" ", "+", $dataURL);

// Decode base64 data
$data = base64_decode($dataURL);

// Validate image
$validationResult = isValidImage($type, $name, $data, strlen($data), MAX_SIZE_PER_FILE, MIN_WIDTH, MIN_HEIGHT);
if (!$validationResult['isValid']) {
    http_response_code(400);
    echo json_encode(["message" => "One or more images were not accepted. Please try uploading different images. Reason: " . $validationResult['message']]);
    exit;
}

if (file_put_contents($filePath, $data)) {
    $origFilePath = UPLOAD_DIR . pathinfo($fileName, PATHINFO_FILENAME) . "." . pathinfo($fileName, PATHINFO_EXTENSION) . ".orig";

    $image = imagecreatefromstring($data);
    $width = imagesx($image);
    $height = imagesy($image);

    if ($width > MAX_WIDTH || $height > MAX_HEIGHT) {
        $ratio = $width / $height;
        if ($width > $height) {
            // Landscape image
            $newWidth = min($width, MAX_WIDTH);
            $newHeight = $newWidth / $ratio;
        } else {
            // Portrait or square image
            $newHeight = min($height, MAX_HEIGHT);
            $newWidth = $newHeight * $ratio;
        }

        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        ob_start();
        imagejpeg($newImage, null, 100);
        $data = ob_get_clean();
    }

    $quality = 50;
    ob_start();
    imagejpeg($image, null, $quality);
    $data = ob_get_clean();

    file_put_contents($origFilePath, $data);
    file_put_contents($filePath, $data);

    // Insert image data into the database

    $conn = mysqli_connect(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
    if (!$conn) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to connect to the database."]);
        exit;
    }

    $success = insertImageToDatabase($filePath, $dataId, $userId, $conn);

    if ($success) {
        http_response_code(200);
        echo json_encode(["message" => "Image uploaded and saved successfully.", "filename" => $fileName]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to upload image or save data in the database."]);
    }

    mysqli_close($conn);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to upload image."]);
}
?>
