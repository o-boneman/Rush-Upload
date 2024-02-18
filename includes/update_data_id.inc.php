<?php

if (!defined('ACCESS_ALLOWED')) {
    http_response_code(403); // Forbidden
    echo json_encode(array("message" => "Direct access is not allowed."));
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_SERVER['CONTENT_TYPE']) && $_SERVER['CONTENT_TYPE'] === 'application/json') {
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    

    if (isset($data['images']) && is_array($data['images'])) {
        $response = updateImages($data, $conn);
        if (isset($response['error'])) {
            http_response_code(500);
        }
        echo json_encode($response);
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Invalid request."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Invalid request method or content type."]);
}