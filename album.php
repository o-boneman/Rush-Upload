<?php
define('ACCESS_ALLOWED', true);
include 'includes\db_connect.php'; // Include your database connection

$userId = 1; // Example user ID
$sql = "SELECT * FROM `tbl-images` WHERE `img-user-id` = ? ORDER BY `img-data-id` LIMIT 20";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$profilePhoto = '';
$albumPhotos = [];

while ($row = $result->fetch_assoc()) {
    if ($row['img-data-id'] === 0) {
        $profilePhoto = $row['img-path'];
    } else {
        $albumPhotos[] = $row['img-path'];
    }
}

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Rush Upload - Example Album</title>
    <!-- Styles -->
    <link rel="stylesheet" href="assets\css\album-styles.css">
</head>
<body>
    <h2 class="Rush-header">My Photo Album</h2>
    <?php if (empty($profilePhoto) && empty($albumPhotos)): ?>
        <p class="no-records-text">No photos found in this album.</p>
    <?php endif; ?>
    <div class="container">
        <div class="gallery">
            <!-- Profile Card -->
            <?php if (!empty($profilePhoto)): ?>
                <div class="gallery-item profile-img">
                    <img class="gallery-image" src=<?php echo htmlspecialchars($profilePhoto); ?>>
                    <div class="main-photo"> Main Photo</div>
                </div>
            <?php endif; ?>
            <!-- Album Photos -->
            <?php foreach ($albumPhotos as $photo): ?>
                <div class="gallery-item">
                    <img class="gallery-image" src=<?php echo htmlspecialchars($photo); ?> alt="sunset behind San Francisco city skyline">
                </div>
            <?php endforeach; ?>  
        </div>
    </div>  
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.0/dist/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>
</html>