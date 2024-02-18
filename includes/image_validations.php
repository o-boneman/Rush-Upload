<?php

if (!defined('ACCESS_ALLOWED')) {
    http_response_code(403); // Forbidden
    echo json_encode(array("message" => "Direct access is not allowed."));
    exit;
}


// includes/image_validations.php
function hasValidTypeAndExtension($type, $fileExtension, $validTypes, $validExtensions) {
    $isValid = in_array($type, $validTypes) && in_array($fileExtension, $validExtensions);
    $message = $isValid ? 'Valid type and extension.' : 'Invalid type or extension.';

    return ['isValid' => $isValid, 'message' => $message];
}

function isFileSizeValid($size, $maxSizePerFile) {
    $isValid = $size <= $maxSizePerFile * 1024 * 1024;
    $message = $isValid ? 'Valid file size.' : 'File size exceeds the limit.';

    return ['isValid' => $isValid, 'message' => $message];
}

function getImageInfo($data) {
    $tempFile = tempnam(sys_get_temp_dir(), 'img');
    file_put_contents($tempFile, $data);
    $imageInfo = getimagesize($tempFile);
    unlink($tempFile);

    $isValid = $imageInfo !== false;
    $message = $isValid ? 'Image is valid.' : 'Image is not valid.';

    return ['isValid' => $isValid, 'message' => $message, 'imageInfo' => $imageInfo];
}

function isImageResolutionValid($imageInfo, $minWidth, $minHeight) {
     $isValid = $imageInfo[0] >= $minWidth && $imageInfo[1] >= $minHeight;
    $message = $isValid ? 'Valid image resolution.' : 'There is something wrong with the image proportions and/or resolutions.';

    return ['isValid' => $isValid, 'message' => $message];
}

function isValidImage($type, $name, $data, $size, $maxSizePerFile, $minWidth = null, $minHeight = null, $checkResolution = true) {
    $validTypes = array("image/jpeg", "image/png");
    $validExtensions = array("jpg", "jpeg", "png");
    $fileExtension = pathinfo($name, PATHINFO_EXTENSION);

    $validationResult = hasValidTypeAndExtension($type, $fileExtension, $validTypes, $validExtensions);
    if (!$validationResult['isValid']) {
        return $validationResult;
    }

    $validationResult = isFileSizeValid($size, $maxSizePerFile);
    if (!$validationResult['isValid']) {
        return $validationResult;
    }

    $imageInfo = getImageInfo($data);
    if ($imageInfo['isValid'] === false) {
        return $imageInfo;
    }

    if ($checkResolution) {
        $validationResult = isImageResolutionValid($imageInfo['imageInfo'], $minWidth, $minHeight);
        if (!$validationResult['isValid']) {
            return $validationResult;
        }
    }

    return ['isValid' => true, 'message' => 'The image is valid.'];
}

