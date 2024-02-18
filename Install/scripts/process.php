<?php
    // Send cache-control headers to prevent browser caching
    header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1
    header("Pragma: no-cache"); // HTTP 1.0
    header("Expires: 0"); // Proxies
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $url = rtrim($_POST["url"], '/');
    $dbhost = $_POST["dbhost"];
    $dbuser = $_POST["dbuser"];
    $dbpass = $_POST["dbpass"];
    $dbname = $_POST["dbname"];
    $updir = rtrim($_POST["updir"], '/');

        // Disable PHP warnings
        error_reporting(E_ERROR | E_PARSE);

    // Check if any of the required variables are empty
    if (empty($url) || empty($dbhost) || empty($dbuser)  || empty($dbname) || empty($updir)) {
        // Return an error message indicating missing data
        echo json_encode(["message" => "Please fill in all the required fields."]);
        exit;
    }

    // Create a database connection and check for errors
    $conn = new mysqli($dbhost, $dbuser, $dbpass, $dbname);

    if ($conn->connect_error) {
        // Return an error message indicating database connection failure
        echo json_encode(["message" => "Database connection failed: " . $conn->connect_error]);
        exit;
    }

    try {
        // Import SQL File
        $filename = __DIR__ . '/../db-import/rush_uploader.sql'; // Specify the correct file path
        // Temporary variable, used to store the current query
        $templine = '';
        // Read in the entire file
        $lines = file($filename);
        // Loop through each line
        foreach ($lines as $line) {
            // Skip it if it's a comment
            if (substr($line, 0, 2) == '--' || trim($line) == '') {
                continue;
            }

            // Add this line to the current segment
            $templine .= $line;
            // If it has a semicolon at the end, it's the end of the query
            if (substr(trim($line), -1, 1) == ';') {
                // Perform the query
                if (!$conn->query($templine)) {
                    // Return an error message indicating SQL file import failure
                    echo json_encode(["message" => "Error importing SQL file"]);
                    exit; // Exit script on error
                }
                // Reset temp variable to empty
                $templine = '';
            }
        }

        $connect_code = '<?php
        // Check for direct access
        if (!defined("ACCESS_ALLOWED")) {
            http_response_code(403); // Forbidden
            echo json_encode(["message" => "Direct access is not allowed."]);
            exit;
        }

        // Define allowed origin
        define("ALLOWED_ORIGIN", "'.$url.'"); // Only this origin is accepted.

        // Database connection parameters
        define("DB_HOST", "'.$dbhost.'");
        define("DB_USERNAME", "'.$dbuser.'");
        define("DB_PASSWORD", "'.$dbpass.'");
        define("DB_NAME", "'.$dbname.'");

        // File upload settings
        define("UPLOAD_DIR", "'.$updir.'/"); // Directory for uploading images
        define("MAX_WIDTH", 1352); // Maximum width of uploaded images (in pixels)
        define("MAX_HEIGHT", 1800); // Maximum height of uploaded images (in pixels)
        define("MIN_WIDTH", 600); // Minimum width of uploaded images (in pixels) (to make minimum quality)
        define("MIN_HEIGHT", 400); // Minimum height of uploaded images (in pixels) (to make minimum quality)
        define("MAX_SIZE_PER_FILE", 5); // Maximum size per uploaded file (in MB, before client-side resized process)';

        $constantsPath = __DIR__ . "/../../includes/constants.php";
        $fp = fopen($constantsPath, "w");
        fwrite($fp, $connect_code);
        fclose($fp);

        $htaccess = 'RewriteEngine On' . PHP_EOL;
        $htaccess .= 'RewriteCond %{SERVER_PORT} 80' . PHP_EOL;
        $htaccess .= 'RewriteRule ^(.*)$ '.$url.'/$1 [R,L]' . PHP_EOL;
        $htaccess .= 'RewriteRule ^example-album$ /album.php [L]';
        $htaccessPath = __DIR__ .'/../../.htaccess';
        $fp = fopen($htaccessPath, "w");
        fwrite($fp, $htaccess);
        fclose($fp);

        
        mkdir(__DIR__ . "/../../". $updir, 0750, true);



        // Send a JSON response back to the JavaScript code
        echo json_encode(["message" => "Form data processed successfully. Please wait..."]);
    } catch (Exception $e) {
        // Handle any exceptions that may occur during the SQL import
        echo json_encode(["message" => "An error occurred during SQL import. Please try again later."]);
    } finally {
        // Close the database connection when done
        $conn->close();
    }
}
