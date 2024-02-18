<?php
        // Check for direct access
        if (!defined("ACCESS_ALLOWED")) {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => "Direct access is not allowed."]);
            exit;
        }

        // Define allowed origin
        define("ALLOWED_ORIGIN", "https://hushload.com"); // Only this origin is accepted.

        // Database connection parameters
        define("DB_HOST", "localhost");
        define("DB_USERNAME", "root");
        define("DB_PASSWORD", "");
        define("DB_NAME", "hush_load");

        // File upload settings
        define("UPLOAD_DIR", "uploads/"); // Directory for uploading images
        define("MAX_WIDTH", 1352); // Maximum width of uploaded images (in pixels)
        define("MAX_HEIGHT", 1800); // Maximum height of uploaded images (in pixels)
        define("MIN_WIDTH", 600); // Minimum width of uploaded images (in pixels) (to make minimum quality)
        define("MIN_HEIGHT", 400); // Minimum height of uploaded images (in pixels) (to make minimum quality)
        define("MAX_SIZE_PER_FILE", 5); // Maximum size per uploaded file (in MB, before client-side resized process)