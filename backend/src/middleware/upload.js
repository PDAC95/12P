const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/properties');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomString-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// File filter for image validation
const imageFileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP image formats are allowed'));
  }
};

// File filter for video validation
const videoFileFilter = (req, file, cb) => {
  // Allowed video formats
  const allowedTypes = /mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video\/(mp4|quicktime|x-msvideo)/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only MP4, MOV, and AVI video formats are allowed'));
  }
};

// Combined file filter for both images and videos
const combinedFileFilter = (req, file, cb) => {
  // Check field name to determine which filter to use
  if (file.fieldname === 'images') {
    return imageFileFilter(req, file, cb);
  } else if (file.fieldname === 'video') {
    return videoFileFilter(req, file, cb);
  } else {
    cb(new Error('Invalid field name. Use "images" for images or "video" for video'));
  }
};

// Configure multer for images
const uploadImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: imageFileFilter
});

// Configure multer for video
const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for video
    files: 1 // Only 1 video file
  },
  fileFilter: videoFileFilter
});

// Configure multer for combined uploads (images + video)
const uploadCombined = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (to accommodate video)
    files: 11 // 10 images + 1 video
  },
  fileFilter: combinedFileFilter
});

// Middleware for uploading multiple property images
const uploadPropertyImages = uploadImages.array('images', 10);

// Middleware for uploading single video
const uploadPropertyVideo = uploadVideo.single('video');

// Middleware for uploading both images and video
const uploadPropertyMedia = uploadCombined.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]);

// Error handling wrapper for images only
const handleImageUpload = (req, res, next) => {
  uploadPropertyImages(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum size is 5MB per image'
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 10 images allowed'
        });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected field name. Use "images" for file uploads'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
};

// Error handling wrapper for combined media (images + video)
const handleUpload = (req, res, next) => {
  uploadPropertyMedia(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        // Check which field caused the error
        const isVideo = err.field === 'video';
        return res.status(400).json({
          success: false,
          error: isVideo 
            ? 'Video file size too large. Maximum size is 50MB'
            : 'File size too large. Maximum size is 5MB per image, 50MB for video'
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 10 images and 1 video allowed'
        });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected field name. Use "images" for images and "video" for video'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
};

// Helper function to delete uploaded files (for cleanup on error)
const deleteUploadedFiles = (files) => {
  if (!files || !Array.isArray(files)) return;
  
  files.forEach(file => {
    const filePath = file.path;
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  });
};

// Helper function to get file URLs for response
const getFileUrls = (files, req) => {
  if (!files || !Array.isArray(files)) return [];
  
  return files.map((file, index) => ({
    url: `/uploads/properties/${file.filename}`,
    alt: '',
    isPrimary: index === 0 // First image is primary by default
  }));
};

// Helper function to get video URL for response
const getVideoUrl = (file) => {
  if (!file) return null;
  return `/uploads/properties/${file.filename}`;
};

// Helper function to validate video duration (requires additional package)
// Note: This is a placeholder - actual implementation would require ffprobe or similar
const validateVideoDuration = async (filePath, maxDurationSeconds = 300) => {
  // For now, we'll skip duration validation
  // In production, you'd use ffprobe or similar to check video duration
  return true;
};

module.exports = {
  handleUpload,
  handleImageUpload,
  deleteUploadedFiles,
  getFileUrls,
  getVideoUrl,
  validateVideoDuration,
  uploadDir
};