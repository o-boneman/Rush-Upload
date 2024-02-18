<?php

if (!defined('ACCESS_ALLOWED')) {
    http_response_code(403); // Forbidden
    echo json_encode(array("message" => "Direct access is not allowed."));
    exit;
}

$json = file_get_contents("php://input");
    $data = json_decode($json, true);

    if (empty($data["fileName"])) {
        http_response_code(400);
        echo json_encode(array("message" => "Missing required data. [Debugger code: 03]"));
        exit;
    }

    $fileName = $data["fileName"];
    $fileNameOrig = $data["fileName"] . ".orig";
    $filePath = UPLOAD_DIR . $fileName;
    $filePathOrigi = UPLOAD_DIR . $fileNameOrig;

   // Function to delete file
    function deleteFile($filePath) {
        if (file_exists($filePath)) {
            return unlink($filePath);
        }
        return false; // File does not exist or failed to delete
    }

    // Function to delete file and database record
function deleteFileAndRecord($filePath, $fileName, $conn) {
    if (deleteFile($filePath)) {
        // File deleted, now delete the corresponding record from the database
        $stmt = $conn->prepare("DELETE FROM `tbl-images` WHERE `img-path` = ?");
        $stmt->bind_param("s", $fileName);


        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode(array("message" => "Image and record deleted successfully."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to delete record from database."));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to delete image."));
    }
}

// Delete the main image file and its database record
deleteFileAndRecord($filePath, $filePath, $conn);

// Delete the original image file (without database record)
if (deleteFile($filePathOrigi)) {
    http_response_code(200);
    echo json_encode(array("message" => "Original image deleted successfully."));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Failed to delete original image."));
}

$conn->close();