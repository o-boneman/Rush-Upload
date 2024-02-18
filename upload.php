<?php
//prevent direct access to include files
define('ACCESS_ALLOWED', true);


header("Content-Type: application/json; charset=UTF-8");

require_once('includes/constants.php');
require_once('includes/image_validations.php');
require_once('includes/functions.php');
require_once('includes/db_connect.php');



checkOrigin(ALLOWED_ORIGIN);

if ($_SERVER['REQUEST_METHOD'] === "POST") {
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    

    if (empty($_SERVER["CONTENT_TYPE"]) || strpos($_SERVER["CONTENT_TYPE"], "application/json") !== 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Content-Type must be application/json."));
        exit;
    } elseif (!isset($data['operation'])) {
        http_response_code(400);
        echo json_encode(array("message" => "Missing 'operation' field in JSON data."));
        exit;
    }

    switch ($data['operation']) {
        case "upload":
            require_once('includes/upload.inc.php');
            break;
        case "update":
            require_once('includes/update.inc.php');
            break;
        case "delete":
            require_once('includes/delete.inc.php');
            break;
        case "restore":
            require_once('includes/restore.inc.php');
            break;
        case "updateDataId":
            require_once('includes/update_data_id.inc.php');
            break;
        default:
            http_response_code(400);
            echo json_encode(array("message" => "Invalid 'operation' value in JSON data."));
            exit;
    }
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
    exit;
}
