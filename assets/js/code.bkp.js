//----------------------------------------------------------------------
// RushLoad v1.0 - A Non Intrusive Wev Upload Script
// Developed by Welisson Gomes - https://github.com/o-boneman/Rushload
//----------------------------------------------------------------------

// --------------------------------------------------------------------------------------
// --- Global Variables ---
// --------------------------------------------------------------------------------------
let imageCount = 0;
const addedFiles = [];
const savedFiles = [];
const filenameMap = new Map();
const serverFilenameMap = new Map();
// --------------------------------------------------------------------------------------
// --- Constants ---
// --------------------------------------------------------------------------------------
const MAX_IMAGES = 5;
const MAX_WIDTH = 1352;
const MAX_HEIGHT = 1800;
const MIN_WIDTH = MAX_WIDTH / 2;
const MIN_HEIGHT = MAX_HEIGHT / 2;
const MIN_CROP_WIDTH = MIN_WIDTH;
const MIN_CROP_HEIGHT = MIN_HEIGHT;
const MAX_FILE_SIZE = 5 // in megabytes 
const PLACEHOLDER = "assets/img/loading.gif";
const placeholder = "assets/img/loading.gif";
// --------------------------------------------------------------------------------------
// --- Dom Elements ---
// --------------------------------------------------------------------------------------
const dropzone = document.getElementById("dropzone");
const iContainer = document.querySelector('.i-container');
const iconUpload = document.querySelector('.icon-upload');
const thumbnailsContainer = document.getElementById("thumbnails");
const responseElement = document.querySelector('.u-response');
const uResponse = document.querySelector('.u-response');
const addMoreBox = document.createElement("div");
thumbnailsContainer.appendChild(addMoreBox);
addMoreBox.innerText = "";
addMoreBox.innerText = "";
thumbnailsContainer.appendChild(addMoreBox);
// --------------------------------------------------------------------------------------
// --- Event Listeners ---
// --------------------------------------------------------------------------------------
dropzone.addEventListener("dragover", handleDragOver);
dropzone.addEventListener("dragleave", handleDragLeave);
dropzone.addEventListener("drop", handleDrop);
dropzone.querySelector("input[type=file]").addEventListener("change", handleInputChange);
dropzone.addEventListener('click', handleClick);
// --------------------------------------------------------------------------------------
// --- Functions ---
// --------------------------------------------------------------------------------------
function handleDragOver(event) {
  event.preventDefault();
  dropzone.classList.add("dragover");
  iconUpload.classList.add('rubberBand');
}
// This function is triggered when a draggable element is dragged out of a dropzone.
function handleDragLeave(event) {
  event.preventDefault();
  dropzone.classList.remove("dragover");
  iconUpload.classList.remove('rubberBand');
}
// This function is called when a draggable element is dropped into the dropzone.
function handleDrop(event) {
  event.preventDefault();
  dropzone.classList.remove("dragover");
  iconUpload.classList.remove('rubberBand');
  iconUpload.classList.add('zoomOut');
  const files = event.dataTransfer.files;
  handleFiles(files);
  iconUpload.addEventListener("animationend", () => {
    iconUpload.classList.remove("zoomOut");
    iContainer.remove();
  });
}
// This function is triggered when the file input field's value changes (i.e., new files are selected).
function handleInputChange(event) {
  const files = event.target.files;
  handleFiles(files);
}
// This function allow add files when user clicks into upload area.
function handleClick(event) {
  if (imageCount < MAX_IMAGES) {
    const fileInput = document.querySelector('#fileInput');
    fileInput.click();
  }
}

// This function processes the list of files selected or dragged by the user.
function handleFiles(files) {
  const duplicateFiles = [];

  // Iterate over the files, respecting the maximum image limit
  for (let i = 0; i < Math.min(files.length, MAX_IMAGES - imageCount); i++) {
    const file = files[i];

    // Continue to the next iteration if the file is not a valid image
    if (!isValidImage(file)) continue;

    // Check if the file has already been added, identifying duplicates
    if (addedFiles.includes(file.name)) {
      duplicateFiles.push(file.name);
      continue;
    }

    // Add the non-duplicate file to the list and create a thumbnail
    addedFiles.push(file.name);
    createThumbnail(file);
  }

  // Highlight the thumbnails corresponding to the duplicate files
  highlightDuplicateThumbnails(duplicateFiles, filenameMap);
  
  // Log if duplicate files are detected
  if (duplicateFiles.length > 0) {
    console.log(`One or more file(s) have already been added.`); 
  }
}

// Highlights the thumbnails of duplicate files by applying an animation
function highlightDuplicateThumbnails(duplicateFiles, filenameMap) {
  if (duplicateFiles.length === 0) return;

  duplicateFiles.forEach((fileName) => {
    console.log('Animating the duplicate file');
    addAnimationToThumbnail(fileName, filenameMap);
  });
}

// Adds animation to the thumbnail corresponding to the file name
function addAnimationToThumbnail(fileName, filenameMap) {
  const thumbnailImage = findThumbnailByFileName(fileName, filenameMap);
  if (!thumbnailImage) return;

  const thumbnail = thumbnailImage.parentElement;
  if (thumbnail) {
    thumbnail.classList.add("bounceIn");
    thumbnail.addEventListener("animationend", () => {
      thumbnail.classList.remove("bounceIn");
    });
  }
}

// Finds the thumbnail corresponding to a specific file name
function findThumbnailByFileName(fileName, filenameMap) {
  for (let [thumbnailImage, mappedFileName] of filenameMap) {
    if (mappedFileName === fileName) {
      return thumbnailImage;
    }
  }
  return null;
}

// Checks if the file is a valid image
function isValidImage(file) {
  const allowedExtensions = [".jpg", ".jpeg", ".png"];
  const allowedMimeTypes = ["image/jpeg", "image/png"];
  const maxFileSize = MAX_FILE_SIZE * 1024 * 1024; //default 5MB

  // Checks file extension
  const extension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  if (!allowedExtensions.includes(`.${extension}`)) {
    console.log("This extension is not accepted")
    return false;
  }

  // Checks the MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    console.log("This MIME type is not accepted")
    return false;
  }

  // Checks the filesize
  if (file.size > maxFileSize) {
    console.log("File size exceed default limit "+MAX_FILE_SIZE+"mb!")
    return false;
  }

  return true;
}


// Main function to create a thumbnail for the provided file
function createThumbnail(file) {
  if (!window.FileReader) {
    console.error("Your browser does not support the FileReader API.");
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => processFileReaderLoad(event, file);
}

// Processes the FileReader's load event
function processFileReaderLoad(event, file) {
  const img = new Image();
  img.src = event.target.result;
  img.onload = () => processImageLoad(img, file);
}

// Processes the image load event
function processImageLoad(img, file) {
  iContainer.remove();
  if (!isImageSizeValid(img)) {
    handleInvalidImageSize(file);
    return;
  }

  const canvas = createCanvas(img);
  const thumbnail = buildThumbnail(file, canvas);
  insertThumbnail(thumbnail);
  setupThumbnailInteraction(thumbnail, file, canvas); // Pass canvas here
}

// Checks if the image size meets the minimum requirements
function isImageSizeValid(img) {
  return img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT;
}

// Handles cases where the image size is invalid
function handleInvalidImageSize(file) {
  removeFileName(file.name);

  if (imageCount === 0) {
    resetScriptState();
  }
  console.log(`One or more image(s) does not meet the minimum resolution requirements (${MIN_WIDTH}x${MIN_HEIGHT}) and has/have not been added.`);
}

// Sets up interactions for the thumbnail (click events, etc.)
function setupThumbnailInteraction(thumbnail, file, canvas) { // Include canvas as a parameter
  const thumbnailImage = thumbnail.querySelector("img");
  setupThumbnailClickEvent(thumbnail, thumbnailImage);
  handleFileUpload(file, thumbnailImage, canvas); // Pass canvas here
}

// Sets up the click event listener for the thumbnail image
function setupThumbnailClickEvent(thumbnail, thumbnailImage) {
  thumbnailImage.addEventListener("click", () => {
    if (!thumbnail.classList.contains("main")) {
      const cropper = createCropper(thumbnailImage);
      openModal(createModalOverlay(thumbnailImage.src, thumbnailImage, cropper));
    }
  });
}

// Handles the file upload process
function handleFileUpload(file, thumbnailImage, canvas) {
  const dataId = thumbnailImage.getAttribute("data-id");
  sendUploadRequest(file, canvas, dataId, (savedFileName) => {
    savedFiles.push(savedFileName);
    serverFilenameMap.set(file.name, savedFileName);
  });
}

// Function to create a canvas element from an image
function createCanvas(img) {
  // Create a new canvas element
  const canvas = document.createElement("canvas");

  // Initialize width and height for the canvas from the image
  let width = img.width;
  let height = img.height;

  // Check if the image width is greater than its height
  if (width > height) {
    // If the width is greater than the maximum allowed width, adjust the width and height
    if (width > MAX_WIDTH) {
      height *= MAX_WIDTH / width;  // Adjust the height to maintain the aspect ratio
      width = MAX_WIDTH;            // Set the width to the maximum allowed width
    }
  } else {
    // If the height is greater than the maximum allowed height, adjust the width and height
    if (height > MAX_HEIGHT) {
      width *= MAX_HEIGHT / height;  // Adjust the width to maintain the aspect ratio
      height = MAX_HEIGHT;           // Set the height to the maximum allowed height
    }
  }

  // Set the dimensions of the canvas
  canvas.width = width;
  canvas.height = height;

  // Get the context of the canvas and draw the image on it
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);  // Draw the image on the canvas with the adjusted dimensions

  // Return the newly created canvas
  return canvas;
}
// Function to build and return a thumbnail element for the provided file
function buildThumbnail(file, canvas) {
  // Create a new div element for the thumbnail
  const thumbnail = document.createElement("div");
  thumbnail.classList.add("thumbnail", "draggable");

  // Assign a unique data-id to the thumbnail
  const dataId = getNextDataId();
  const thumbnailImage = createThumbnailImage(dataId, placeholder);

  // Store the file name in filenameMap with the thumbnailImage as the key
  filenameMap.set(thumbnailImage, file.name);

  // Convert the canvas to a blob and set it as the thumbnail image source
  setCanvasAsThumbnailImage(canvas, thumbnailImage);

  // Append the image and hover elements to the thumbnail
  thumbnail.appendChild(thumbnailImage);
  thumbnail.appendChild(createHoverDiv());

  // Set up click event listener for the thumbnail image
  setupThumbnailClickListener(thumbnail, thumbnailImage);

  return thumbnail;
}

// Generate the next data-id based on the current number of thumbnails
function getNextDataId() {
  const thumbnails = document.querySelectorAll(".thumbnail");
  const index = thumbnails.length + 1;
  return index.toString().padStart(2, '0');
}

// Create and return a thumbnail image element with the given data-id and source
function createThumbnailImage(dataId, src) {
  const thumbnailImage = document.createElement("img");
  thumbnailImage.setAttribute("data-id", dataId);
  thumbnailImage.src = src;
  return thumbnailImage;
}

// Set the canvas content as the source of the thumbnail image
function setCanvasAsThumbnailImage(canvas, thumbnailImage) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    thumbnailImage.src = url;
  });
}

// Set up click event listener for the thumbnail image
function setupThumbnailClickListener(thumbnail, thumbnailImage) {
  thumbnailImage.addEventListener("click", () => {
    if (!thumbnail.classList.contains("main")) {
      const cropperOptions = getCropperOptions();
      const cropper = new Cropper(thumbnailImage, cropperOptions);
      openModal(thumbnailImage, cropper);
    }
  });
}

// Define Cropper options
function getCropperOptions(autoCropArea = 0.95) {
  return {
    aspectRatio: 1 / 2,
    viewMode: 2, // Choose either 1 or 2 depending on your requirement
    zoomable: false,
    minCropBoxWidth: MIN_CROP_WIDTH,
    minCropBoxHeight: MIN_CROP_HEIGHT,
    autoCropArea: autoCropArea
  };
}
// Create a Cropper instance 
function createCropper(thumbnailImage) {
  const options = getCropperOptions();
  return new Cropper(thumbnailImage, options);
}
// Function to insert a thumbnail into the thumbnails container
function insertThumbnail(thumbnail) {
  // Check if the 'addMoreBox' is currently within the thumbnails container
  if (thumbnailsContainer.contains(addMoreBox)) {
    // If 'addMoreBox' is present, insert the new thumbnail before the 'addMoreBox'
    thumbnailsContainer.insertBefore(thumbnail, addMoreBox);
  } else {
    // If 'addMoreBox' is not present, simply append the new thumbnail to the end of the thumbnails container
    thumbnailsContainer.appendChild(thumbnail);
  }

  // Increment the count of images (thumbnails) added
  imageCount++;

  // Update the 'Add More' box to reflect the new count of images
  updateAddMoreBox();

  // Hide the paragraph inside the element with ID 'dropzone'
  // This might be used to hide instructions or placeholders once an image is added
  document.getElementById("dropzone").getElementsByTagName("p")[0].style.display = "none";
}

// Function to update the 'Add More' box based on the current number of images
function updateAddMoreBox() {
  // Calculate the remaining number of images that can be added
  const remains = MAX_IMAGES - imageCount;

  // Update the inner text of 'addMoreBox' with the remaining number of images
  // Display the number with a leading zero and use the singular or plural form of 'image' as appropriate
  addMoreBox.innerText = `Add more \n${remains.toString().padStart(2, '0')}\n ${remains >= 2 ? 'images' : 'image'}`;

  if (imageCount < MAX_IMAGES) {
    // If the maximum number of images has not been reached, show the 'Add More' box
    // Add relevant CSS classes for styling and animation
    addMoreBox.classList.add("add-more", "anima-add-more");
    // Append 'addMoreBox' to the thumbnails container
    thumbnailsContainer.appendChild(addMoreBox);
  } else {
    // If the maximum number of images has been reached, remove the 'Add More' box from the DOM
    // The commented-out line suggests an intention to add a fade-out animation class before removal
    // addMoreBox.classList.add("fade-out");
    thumbnailsContainer.removeChild(addMoreBox);
  }
}

// Initializes the sortable functionality on the element with the ID 'thumbnails'.
$(function() {
  $("#thumbnails").sortable({
    axis: "x",
    delay: 300,
    items: ".draggable",
    distance: 1,
    revert: true,
    revertDuration: 100,
    placeholder: "draggable-placeholder",
    forcePlaceholderSize: true,
    opacity: 0.92,
    stop: function(event, ui) {
      $("#thumbnails .draggable").each(function(index) {
        var img = $(this).find('img');
        var dataId = (index + 1).toString().padStart(2, '0');
        img.attr('data-id', dataId);
      });
    },
    update: function(event, ui) {
      $("#thumbnails .draggable").each(function(index) {
        var img = $(this).find('img');
        var dataId = (index + 1).toString().padStart(2, '0');
        img.attr('data-id', dataId);

          var orderedDataIds = $("#thumbnails .draggable").map(function() {
            return $(this).find('img').attr('data-id');
        }).get();
        sendOrderUpdate(orderedDataIds);
      });
    }
  });
});
$("#thumbnails").sortable({
    cancel:".main"
});


// Function to remove a given file name from the 'addedFiles' array
function removeFileName(fileName) {
  // Find the index of the file name in the 'addedFiles' array
  const indexToRemove = addedFiles.indexOf(fileName);

  // Check if the file name is found in the array
  if (indexToRemove !== -1) {
    // If the file name is found, remove it from the array
    addedFiles.splice(indexToRemove, 1);
  }
}

// Function to open a modal with a given thumbnail image and cropper instance
function openModal(thumbnailImage, cropper) {
  // Get the source URL of the thumbnail image
  const imageSrc = thumbnailImage.src;

  // Create a modal overlay using the image source, thumbnail image, and cropper instance
  const modalOverlay = createModalOverlay(imageSrc, thumbnailImage, cropper);

  // Append the modal overlay to the document body to display it
  document.body.appendChild(modalOverlay);

  // Add a 'fade-in' class to the modal overlay after a short delay to create a fade-in effect
  // This timeout allows for the CSS transition to be visible to the user
  setTimeout(() => {
    modalOverlay.classList.add("fade-in");
  }, 50);
}

// Function to save the original image source URL of a thumbnail image
function saveOriginalImage(thumbnailImage) {
  // Check if the thumbnail image already has a 'data-original-bloburl' attribute
  if (!thumbnailImage.getAttribute("data-original-bloburl")) {
    // If not, get the current source URL (blob URL) of the thumbnail image
    const originalBlobUrl = thumbnailImage.src;

    // Set this URL as the value of the 'data-original-bloburl' attribute
    // This preserves the original image source for future reference
    thumbnailImage.setAttribute("data-original-bloburl", originalBlobUrl);
  }
}

// Main function to create and return a modal overlay
function createModalOverlay(imageSrc, thumbnailImage) {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";

  const modalContent = createModalContent(imageSrc, thumbnailImage);
  modalOverlay.appendChild(modalContent);

  // Setup the double-click event listener for closing the modal
  modalOverlay.addEventListener("dblclick", (event) => {
    if (event.target === modalOverlay) {
      closeModalActions(thumbnailImage);
    }
  });

  return modalOverlay;
}

// Function to create and return the modal content
function createModalContent(imageSrc, thumbnailImage) {
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const closeButton = createCloseButton(thumbnailImage);
  modalContent.appendChild(closeButton);

  const modalImage = createModalImage(imageSrc);
  modalContent.appendChild(modalImage);

  const cropper = initializeCropper(modalImage);

  const cropButton = createCropButton(thumbnailImage, cropper);
  modalContent.appendChild(cropButton);

  return modalContent;
}

// Function to create and return the close button
function createCloseButton(thumbnailImage) {
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  closeButton.addEventListener("click", () => {
    closeModalActions(thumbnailImage);
  });

  return closeButton;
}

// Function to create and return the modal image
function createModalImage(imageSrc) {
  const modalImage = document.createElement("img");
  modalImage.src = imageSrc;
  modalImage.style.maxWidth = '100%';
  return modalImage;
}

// Function to initialize and return the Cropper instance
function initializeCropper(modalImage) {
  return new Cropper(modalImage, getCropperOptions());
}

// Function to create and return the crop button
function createCropButton(thumbnailImage, cropper) {
  const cropButton = document.createElement("button");
  cropButton.innerText = "CROP IMAGE";
  cropButton.classList.add("crop-button");

  cropButton.addEventListener("click", () => {
    performCropActions(thumbnailImage, cropper);
  });

  return cropButton;
}

// Function to perform actions when the modal is closed
function closeModalActions(thumbnailImage, cropper) {
  // Remove the 'main' class from the relevant thumbnail element
  removeMainClass();

  // Update data-id attributes and re-enable draggability for all thumbnails
  const thumbnails = document.querySelectorAll(".thumbnail");
  updateDataIdAndReenableDraggable(thumbnails);
  //update database
  sendOrderUpdate()

  // Close the modal window
  closeModal();

  // Destroy the cropper instance
  if (cropper) {
    cropper.destroy();
  }
}


// Actions to perform when the crop button is clicked
function performCropActions(thumbnailImage, cropper) {
  // Get the cropped image as a data URL
  const croppedDataUrl = cropper.getCroppedCanvas().toDataURL();
  
  // Update the thumbnail image source with the cropped image
  thumbnailImage.src = croppedDataUrl;
  
  // Update data-id attributes and re-enable draggability for all thumbnails
  const thumbnails = document.querySelectorAll(".thumbnail");
  updateDataIdAndReenableDraggable(thumbnails);
  
  // Add 'main' class to the closest thumbnail container
  const mainThumbnail = thumbnailImage.closest(".thumbnail");
  mainThumbnail.classList.add("main");

  // Close the modal and destroy the cropper instance
  closeModal();
  cropper.destroy();

  // Update the position of the main thumbnail if necessary
  const thumbnailContainer = document.getElementById("thumbnails");
  const firstThumbnail = thumbnailContainer.firstChild;
  thumbnailImage.setAttribute('data-id', '00');
  if (firstThumbnail !== mainThumbnail) {
    moveSmoothly(mainThumbnail, firstThumbnail);
  }

  // Retrieve and send updated image information to the server
  const originalFilename = filenameMap.get(thumbnailImage);
  const oldServerFileName = serverFilenameMap.get(originalFilename);

 
  
  sendUpdateRequest(oldServerFileName, croppedDataUrl, (newServerFileName) => {
    serverFilenameMap.set(originalFilename, newServerFileName);
  });

  // Check if the main image has the correct data-id and call sendOrderUpdate if so
  if (thumbnailImage.getAttribute('data-id') === '00') {
    sendOrderUpdate();
  }

  // Update data-id attributes and re-enable draggability for all thumbnails again
  updateDataIdAndReenableDraggable(thumbnails);
}

function removeMainClass() {
  const thumbnails = document.querySelectorAll(".thumbnail");
  thumbnails.forEach((thumbnail) => {
    if (thumbnail.classList.contains("main")) {
      thumbnail.classList.remove("main");
    }
    
  });
}


function closeModal() {
  const modalOverlay = document.querySelector('.modal-overlay');
  modalOverlay.parentNode.removeChild(modalOverlay);

  const thumbnails = document.querySelectorAll(".thumbnail");
  updateDataIdAndReenableDraggable(thumbnails);
}
/**
 * Creates a hover div element with star and trash icons for thumbnail interactions.
 *
 * @returns {HTMLDivElement} The created hover div element.
 */
function createHoverDiv() {
  // Helper function to create a div element with specified class names
  const createDivWithClasses = (classNames) => {
    const div = document.createElement("div");
    div.classList.add(...classNames);
    return div;
  };

  // Create the main hover div element
  const hoverDiv = createDivWithClasses(["hover-div"]);
  const hoverText = document.createElement("span");
  hoverText.innerText = "";

  // Create elements for star, trash, and star badge
  const divStarBadge = createDivWithClasses(["flexbox-div", "starBadge"]);
  const divStar = createDivWithClasses(["flexbox-div", "u-icons", "star"]);
  const divTrash = createDivWithClasses(["flexbox-div", "u-icons", "trash"]);

  // Function to set the clicked thumbnail as the main thumbnail
  const setMainThumbnail = (thumbnail) => {
    const thumbnailImage = thumbnail.querySelector("img");
    saveOriginalImage(thumbnailImage);
    thumbnailImage.setAttribute("data-id", "00");
    openModal(thumbnailImage);
    thumbnail.classList.add("main");
    thumbnail.classList.remove("draggable");
  };

  // Event listener for clicking the star icon
  divStar.addEventListener("click", (event) => {
    event.stopPropagation();
    const thumbnails = document.querySelectorAll(".thumbnail");

    thumbnails.forEach((thumbnail) => {
      if (thumbnail.classList.contains("main")) {
        const thumbnailImage = thumbnail.querySelector("img");
        const originalBlobUrl = thumbnailImage.getAttribute("data-original-bloburl");

        if (originalBlobUrl) {
          thumbnailImage.src = originalBlobUrl;
        }

        const originalFilename = filenameMap.get(thumbnailImage);
        const previousMainImageFilename = serverFilenameMap.get(originalFilename);

        if (previousMainImageFilename) {
          restoreOriginalImage(previousMainImageFilename)
            .then((response) => {
              console.log("Image restored successfully:", response);
            })
            .catch((error) => {
              console.error("Failed to restore image:", error);
            });
        }
      }

      thumbnail.classList.remove("main");
    });

    updateDataIdAndReenableDraggable(thumbnails);
    setMainThumbnail(divStar.closest(".thumbnail"));
  });

  // Event listener for clicking the trash icon
  divTrash.addEventListener("click", (event) => {
    event.stopPropagation();
    const thumbnail = event.target.closest(".thumbnail");
    const thumbnailImage = thumbnail.querySelector("img");
    const originalFilename = filenameMap.get(thumbnailImage);
    const serverFileName = serverFilenameMap.get(originalFilename);

    thumbnail.classList.add("zoomOut");

    thumbnail.addEventListener("animationend", () => {
      const fileName = filenameMap.get(thumbnailImage);
      removeFileName(fileName);
      thumbnail.classList.remove("zoomOut");

      if (thumbnail.parentElement) {
        thumbnail.parentElement.removeChild(thumbnail);
      }

      imageCount--;
      updateAddMoreBox();
      sendDeleteRequest(serverFileName);

      if (imageCount === 0) {
        resetScriptState();
      }
    });
  });

  // Create a flex container to hold star, trash, and star badge
  const flexContainer = createDivWithClasses(["flexbox-container"]);
  flexContainer.appendChild(divStar);
  flexContainer.appendChild(divTrash);
  flexContainer.appendChild(divStarBadge);
  hoverDiv.appendChild(flexContainer);

  return hoverDiv;
}

/**
 * Moves an HTML element smoothly by fading it out, repositioning it, and fading it back in.
 *
 * @param {HTMLElement} element - The HTML element to be moved smoothly.
 * @param {HTMLElement} target - The target element before which the 'element' should be inserted.
 */
function moveSmoothly(element, target) {
  const duration = 300; // Set the duration of the animation in milliseconds
  
  // Fade out the element
  element.style.transition = `opacity ${duration}ms`;
  element.style.opacity = 0;

  setTimeout(() => {
    // Move the element and fade it back in
    target.parentNode.insertBefore(element, target);
    element.style.opacity = 1;
  }, duration);
}

///----------------------------------------------------------------------------------
// -- Ajax requests to upload.php --
///----------------------------------------------------------------------------------

/**
 * Upload images to the server / database
 *
 * @param {File} file - The file to be uploaded.
 * @param {HTMLCanvasElement} canvas - The canvas element containing the image data.
 * @param {string} dataId - The identifier associated with the file data.
 * @param {function} callback - A callback function to handle the response.
 */
function sendUploadRequest(file, canvas, dataId, callback) {
  // Create a new XMLHttpRequest object
  const xhr = new XMLHttpRequest();

  // Configure the XMLHttpRequest
  xhr.open("POST", "upload.php"); // Set the request method and target URL
  xhr.setRequestHeader("Content-Type", "application/json"); // Set request headers

  // Define the onload event handler
  xhr.onload = () => {
    if (xhr.status === 200) {
      // If the response status is 200 (OK), handle the success case
      const response = JSON.parse(xhr.responseText);
      const savedFileName = response.filename;

      // Call the provided callback function with the saved filename
      callback(savedFileName);

      // Log the server response
      console.log(xhr.responseText);

      // Update the serverFilenameMap with the new server-generated filename
      serverFilenameMap.set(file.name, savedFileName);

      // Find the associated thumbnail image in filenameMap
      const thumbnailImage = Array.from(filenameMap.keys()).find((img) => filenameMap.get(img) === file.name);

      if (thumbnailImage) {
        // Update the data attribute of the thumbnail image with the saved filename if needed
        //thumbnailImage.setAttribute("data-server-filename", savedFileName);
      }
    } else if (xhr.status === 400 || xhr.status === 403) {
      // If the response status is 400 (Bad Request) or 403 (Forbidden), handle the error case
      const response = JSON.parse(xhr.responseText);

      // Log the error message (you can change this to your own alert type)
      console.log(response.message);

      // Remove the file from the filenameMap
      removeFileName(file.name);

      // Find the associated thumbnail image in filenameMap
      const thumbnailImage = Array.from(filenameMap.keys()).find((img) => filenameMap.get(img) === file.name);

      if (thumbnailImage) {
        // Handle the case of a broken script with large images
        const thumbnail = thumbnailImage.closest(".thumbnail");
        filenameMap.delete(thumbnailImage);
        serverFilenameMap.delete(thumbnailImage);

        if (thumbnail) {
          const thumbnailParent = thumbnail.parentElement;

          if (thumbnailParent) {
            // Remove the thumbnail from its parent element
            thumbnailParent.removeChild(thumbnail);
          }

          // Log the data in filenameMap
          console.log('filenameMap:');
          filenameMap.forEach((value, key) => {
            console.log(`Key: ${key}, Value: ${value}`);
          });

          // Log the data in serverFilenameMap
          console.log('serverFilenameMap:');
          serverFilenameMap.forEach((value, key) => {
            console.log(`Key: ${key}, Value: ${value}`);
          });

          // Update image count and the "Add More" box
          imageCount--;
          updateAddMoreBox();

          if (imageCount === 0) {
            // Reset the script state if there are no more images
            resetScriptState();
          }
        }
      }
    }
  };

  // Send the request with the necessary data
  xhr.send(
    JSON.stringify({
      name: file.name,
      type: file.type,
      data: canvas.toDataURL(),
      dataId: dataId,
      operation: "upload" // To handle upload.php switch
    })
  );
}

/**
 * Update thumbnail images data-ids order in server
 */
function sendOrderUpdate() {
  // Map the data needed for the update from the thumbnail images
  var imageOrderData = $("#thumbnails .thumbnail").map(function () {
    var img = $(this).find('img');
    var originalFilename = filenameMap.get(img[0]); // Get the original filename for the thumbnail
    var serverFileName = serverFilenameMap.get(originalFilename); // Get the server filename using original filename
    return {
      serverFileName: serverFileName, // Server-generated unique identifier
      newDataId: img.attr('data-id') // New data-id (order)
    };
  }).get();

  // Create an XMLHttpRequest object for the AJAX request
  const xhr = new XMLHttpRequest();

  // Configure the XMLHttpRequest
  xhr.open("POST", "upload.php"); // The server-side script to handle the update
  xhr.setRequestHeader("Content-Type", "application/json");

  // Define the onload event handler for a successful response
  xhr.onload = () => {
    if (xhr.status === 200) {
      // Handle a successful response
      const response = JSON.parse(xhr.responseText);
      console.log("Order updated:", response.message);
    } else {
      // Handle an error response
      console.error("Error updating order:", xhr.responseText);
    }
  };

  // Define the onerror event handler for request failures
  xhr.onerror = () => {
    console.error("Request failed");
  };

  // Send the request with the image order data and operation type
  xhr.send(JSON.stringify({
    images: imageOrderData,
    operation: 'updateDataId' // To handle upload.php Switch
  }));
}

/**
 * Sends the cropped image data to the server to overwrite the previous no-cropped image based into oldServerFileName.
 * @param {string} oldServerFileName - The original filename on the server before updating.
 * @param {string} dataUrl - The data URL of the cropped image.
 * @param {function} callback - A callback function that is called after the request is complete.
 */
function sendUpdateRequest(oldServerFileName, dataUrl, callback) {
  // Create a new XMLHttpRequest object for making the HTTP request
  const xhr = new XMLHttpRequest();

  // Configure the request to use the POST method and target the 'upload.php' endpoint
  xhr.open("POST", "upload.php");

  // Set the request header to indicate the content type as JSON
  xhr.setRequestHeader("Content-Type", "application/json");

  // Define what happens when the request is successfully completed
  xhr.onload = () => {
    // Parse the JSON response received from the server
    const response = JSON.parse(xhr.responseText);

    // Extract the new server filename from the response
    const newServerFileName = response.filename;

    // Call the provided callback function with the new server filename
    callback(newServerFileName);

    // Optionally log the server response for debugging purposes
    console.log(xhr.responseText);
  };

  // Send the request with the payload containing the old server filename, 
  // the data URL of the image, and the operation type (update)
  xhr.send(
    JSON.stringify({
      oldServerFileName: oldServerFileName,
      data: dataUrl,
      operation: "update" // Indicates the type of operation to be handled by 'upload.php'
    })
  );
}

/**
 * Restores the original image (.orig extension) case crop has changed or aborted.
 * @param {string} filename - The name of the file to be restored.
 * @returns {Promise} A promise that resolves with the server response if successful, or rejects if an error occurs.
 */
function restoreOriginalImage(filename) {
  return new Promise((resolve, reject) => {
    // Create a new XMLHttpRequest object for making the HTTP request
    const xhr = new XMLHttpRequest();
    const url = "upload.php";

    // Configure the request to use the POST method and target the 'upload.php' endpoint
    xhr.open("POST", url, true);

    // Set the request header to indicate the content type as JSON
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    // Define what happens on state changes of the XMLHttpRequest
    xhr.onreadystatechange = () => {
      // Check if the request has been completed
      if (xhr.readyState === 4) {
        // Successful HTTP request
        if (xhr.status === 200) {
          if(xhr.responseText) {
            // Resolve the promise with the parsed response from the server
            resolve(JSON.parse(xhr.responseText));
          }
        } else {
          // Reject the promise in case of an HTTP error response
          reject(JSON.parse(xhr.responseText));
        }
      }
    };

    // Prepare the data payload containing the filename and operation type
    const data = JSON.stringify({
      filename: filename, 
      operation: "restore" // Indicates the type of operation to be handled by 'upload.php'
    });

    // Send the prepared request to the server
    xhr.send(data);
  });
}
/**
 * Delete the image file into server (folder/database)
 *
 * @param {string} fileName - The name of the file to be deleted.
 */
function sendDeleteRequest(fileName) {
  // Retrieve all thumbnail elements
  const thumbnails = document.querySelectorAll(".thumbnail");

  // Update the data-ids and re-enable draggable for the thumbnails
  updateDataIdAndReenableDraggable(thumbnails);

  // Create an XMLHttpRequest object for the AJAX request
  const xhr = new XMLHttpRequest();

  // Configure the XMLHttpRequest
  xhr.open("POST", "upload.php"); // The server-side script to handle the delete operation
  xhr.setRequestHeader("Content-Type", "application/json");

  // Define the onload event handler for a successful response
  xhr.onload = () => {
    // After a successful delete operation, send an order update request
    sendOrderUpdate();

    // Log the server response
    console.log(xhr.responseText);
  };

  // Send the request with the file name and operation type
  xhr.send(
    JSON.stringify({
      fileName: fileName,
      operation: "delete" // To handle upload.php Switch
    })
  );
}


/**
 * Updates the data-ids and re-enables draggable behavior for thumbnail elements.
 *
 * @param {NodeList} thumbnails - A NodeList containing the thumbnail elements to be updated.
 */
function updateDataIdAndReenableDraggable(thumbnails) {
  let mainFound = false; // Flag to track if a "main" thumbnail is found
  let dataIndex = 1; // Index for generating new data-ids

  console.log("Total thumbnails:", thumbnails.length); // Debugging

  thumbnails.forEach((thumbnail, index) => {
    if (thumbnail.classList.contains("main")) {
      mainFound = true;
    } else {
      const thumbnailImage = thumbnail.querySelector("img");
      const newDataId = dataIndex.toString().padStart(2, '0'); // Generate a new data-id

      thumbnailImage.setAttribute('data-id', newDataId); // Update the data-id attribute
      dataIndex++;

      if (!thumbnail.classList.contains("draggable")) {
        thumbnail.classList.add("draggable"); // Re-enable draggable behavior if not already added
      }
    }
  });

  // If no "main" thumbnail is found, update data-ids for all thumbnails sequentially
  if (!mainFound) {
    thumbnails.forEach((thumbnail, index) => {
      const thumbnailImage = thumbnail.querySelector("img");
      const newDataId = (index + 1).toString().padStart(2, '0'); // Generate a new data-id

      thumbnailImage.setAttribute('data-id', newDataId); // Update the data-id attribute
    });
  }
}


// Function to reset the script's state to its initial configuration
function resetScriptState() {
  // Clear the lists of added and saved files
  addedFiles.length = 0;
  savedFiles.length = 0;

  // Reset the count of images
  imageCount = 0;

  // Remove 'addMoreBox' from 'thumbnailsContainer' if it exists
  if (thumbnailsContainer.contains(addMoreBox)) {
      thumbnailsContainer.removeChild(addMoreBox);
  }

  // Make the paragraph inside the 'dropzone' visible
  document.getElementById("dropzone").getElementsByTagName("p")[0].style.display = "block";

  // Ensure 'iContainer' is the first child of 'dropzone' if it's not already in place
  if (!dropzone.contains(iContainer)) {
      dropzone.insertBefore(iContainer, dropzone.firstChild);
  }

  // Remove the 'zoomOut' class from 'iconUpload'
  iconUpload.classList.remove("zoomOut");
}