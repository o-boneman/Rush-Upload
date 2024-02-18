<?php

if (!defined('ACCESS_ALLOWED')) {
    http_response_code(403); // Forbidden
    echo json_encode(array("message" => "Direct access is not allowed."));
    exit;
}

/**
 * Generates a unique filename based on the original filename and adds a microtime-based MD5 hash to ensure uniqueness.
 *
 * @param string $originalFileName The original filename with its extension.
 * @param int $maxAttempts Maximum number of attempts to generate a unique filename (safeguard).
 *
 * @return string|false The generated unique filename or false if maxAttempts is exceeded.
 */
/**
 * Generates a unique filename based on the original filename, microtime, and uniqid.
 *
 * @param string $originalFileName The original filename with its extension.
 * @param int $maxAttempts Maximum number of attempts to generate a unique filename (safeguard).
 *
 * @return string|false The generated unique filename or false if maxAttempts is exceeded.
 */
function generateUniqueFileName($originalFileName, $userId) {
    // Remove any potentially dangerous characters from the original file name
    $sanitizedFileName = preg_replace("/[^a-zA-Z0-9_.-]/", "", $originalFileName);

    // Validate the file extension
    $extension = pathinfo($sanitizedFileName, PATHINFO_EXTENSION);
    if (preg_match("/[^a-zA-Z0-9]/", $extension)) {
        // Extension contains invalid characters
        throw new Exception("Invalid file extension");
    }

    // Check for null bytes in the filename
    if (strpos($sanitizedFileName, "\0") !== false) {
        throw new Exception("Null byte in file name");
    }

    // Create a portion of the file name using a hash of the user's ID
    $userIdHash = md5($userId);

    // Generate a unique filename based on microtime and user ID
    $uniqueFileName = md5(uniqid() . microtime())  . $userIdHash . "." . $extension;

    // Check if the filename is too long (adjust the length as needed)
    if (strlen($uniqueFileName) > 255) {
        throw new Exception("File name is too long");
    }

    return $uniqueFileName;
}



function restoreOriginalImage($fileName) {
    $filePath = UPLOAD_DIR . $fileName;
    $croppedFilePath = UPLOAD_DIR . $fileName . ".orig";

    if (file_exists($croppedFilePath)) {
        if (copy($croppedFilePath, $filePath)) {
            return true;
        } else {
            error_log("Failed to copy cropped file to original file in: >>" . $croppedFilePath);
            return false;
        }
    } else {
        error_log("Cropped file not found: " . $croppedFilePath);
        return false;
    }
}

function isValidInput($item) {
    // Check if the item is an array with the required keys
    if (!is_array($item) || !isset($item['serverFileName'], $item['newDataId'])) {
        return false;
    }

    // Validate serverFileName
    if (!is_string($item['serverFileName']) || !preg_match('/\.(jpg|jpeg|png)$/', $item['serverFileName'])) {
        return false;
    }

    // Validate newDataId
    if (!is_string($item['newDataId']) || !is_numeric($item['newDataId'])) {
        return false;
    }

    return true;
}

function insertImageToDatabase($filePath, $dataId, $userId, $conn) {
    $stmt = $conn->prepare("INSERT INTO `tbl-images` (`img-path`, `img-data-id`, `img-user-id`) VALUES (?, ?, ?)");
    $stmt->bind_param("sii", $filePath, $dataId, $userId);
    $success = $stmt->execute();
    $stmt->close();
    return $success;
}


function updateImages($data, $conn) {
    $conn->begin_transaction();
    try {
        foreach ($data['images'] as $item) {
            $newDataId = filter_var($item['newDataId'], FILTER_SANITIZE_STRING);
            $serverFileName = UPLOAD_DIR . filter_var($item['serverFileName'], FILTER_SANITIZE_STRING);

            if (!isValidInput($item)) {
                throw new Exception("Invalid input data");
            }

            $stmt = $conn->prepare("UPDATE `tbl-images` SET `img-data-id` = ? WHERE `img-path` = ?");
            $stmt->bind_param("is", $newDataId, $serverFileName);
            $stmt->execute();
        }

        $conn->commit();
        return ["message" => "Order updated successfully."];
    } catch (Exception $e) {
        $conn->rollback();
        // Log error here
        return ["error" => "Failed to update order: " . $e->getMessage()];
    } finally {
        $conn->close();
    }
}
function deleteOldImageFile($fileName) {
    $filePath = UPLOAD_DIR . $fileName;
    if (file_exists($filePath)) {
        unlink($filePath);
    }
}

function processAndSaveImage($dataURL, $oldFileName) {
    
    // Validate the base64 image data
    $validationResult = validateBase64Image($dataURL);
    if (!$validationResult['isValid']) {
        return ['success' => false, 'error' => $validationResult['message']];
    }

    // Decode the image data from base64
    $data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $dataURL));

    // Get the MIME type of the image from the data
    $imageInfo = getimagesizefromstring($data);
    if ($imageInfo === false) {
        return ['success' => false, 'error' => 'Invalid image data.'];
    }

    $type = $imageInfo['mime'];
    $validTypes = array("image/jpeg", "image/png");
    if (!in_array($type, $validTypes)) {
        return ['success' => false, 'error' => 'Unsupported image type.'];
    }

    // Validate image size
    if (strlen($data) > MAX_SIZE_PER_FILE * 1024 * 1024) {
        return ['success' => false, 'error' => 'Image size exceeds the limit.'];
    }

    // Process image resizing if necessary
    $image = imagecreatefromstring($data);
    list($width, $height) = $imageInfo;

    if ($width > MAX_WIDTH || $height > MAX_HEIGHT) {
        $image = resizeImage($image, $width, $height);
    }

    $oldFileName = sanitizeFileName($oldFileName);
    $filePath = UPLOAD_DIR . $oldFileName;
    if (!isValidFilePath($filePath)) {
        return ['success' => false, 'error' => 'Invalid file path.'];
    }

    // Save the processed image according to its MIME type
    $saveResult = false;
    switch ($type) {
        case 'image/jpeg':
            $saveResult = imagejpeg($image, $filePath);
            break;
        case 'image/png':
            $saveResult = imagepng($image, $filePath);
            break;
    }

    imagedestroy($image); // Free up memory

    if ($saveResult) {
        return ['success' => true, 'filename' => $oldFileName];
    } else {
        return ['success' => false, 'error' => 'Failed to save the image.'];
    }
}


function resizeImage($image, $width, $height) {
    // Resize logic (maintaining aspect ratio)
    $ratio = $width / $height;
    if ($width > $height) {
        $newWidth = min($width, MAX_WIDTH);
        $newHeight = $newWidth / $ratio;
    } else {
        $newHeight = min($height, MAX_HEIGHT);
        $newWidth = $newHeight * $ratio;
    }

    $newImage = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    return $newImage;
}

function sanitizeFileName($fileName) {
    $fileName = basename($fileName); // Removes directory path
    $fileName = preg_replace("/[^a-zA-Z0-9\.\-\_]/", "", $fileName); // Removes special characters
    return $fileName;
}

function isValidFilePath($filePath) {
    return strpos($filePath, '..') === false && strpos($filePath, UPLOAD_DIR) === 0;
}
function validateBase64Image($dataURL) {
    // Check if the string is a valid base64 encoded data
    if (!preg_match('/^data:image\/(jpeg|png);base64,/', $dataURL)) {
        return ['isValid' => false, 'message' => 'Invalid image format. Only JPEG and PNG are allowed.'];
    }

    // Remove the base64 URL part for decoding
    $imageData = explode(',', $dataURL)[1];
    
    // Check if the string is valid base64
    if (!base64_decode($imageData, true)) {
        return ['isValid' => false, 'message' => 'Invalid base64 data.'];
    }

    // Decode the image
    $decodedImageData = base64_decode($imageData);
    $image = imagecreatefromstring($decodedImageData);
    if (!$image) {
        return ['isValid' => false, 'message' => 'Decoding of image failed.'];
    }

    // Further checks can be performed here, such as image size validation

    // Destroy the created image resource to free memory
    imagedestroy($image);

    return ['isValid' => true, 'message' => 'Image is valid.'];
}
function checkOrigin($allowedOrigin) {
    $request_origin = $_SERVER['HTTP_ORIGIN'];

    if ($request_origin === $allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    } else {
        http_response_code(403);
        echo json_encode(array(
            "message" => "Sorry, origin not acceptable. "));
        exit;
    }
}
