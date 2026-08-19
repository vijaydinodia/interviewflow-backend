const { hasCloudinary } = require("../middleware/uploadMiddleware");

// POST /upload/image — Upload image (avatar, company logo)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please attach an image.",
      });
    }

    let fileUrl = req.file.path;
    // If uploaded locally via diskStorage
    if (!hasCloudinary || !fileUrl.startsWith("http")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      fileUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        filename: req.file.filename,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to upload image.",
    });
  }
};

// POST /upload/pdf — Upload PDF (resume, verification document)
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file provided. Please attach a PDF document.",
      });
    }

    let fileUrl = req.file.path;
    // If uploaded locally via diskStorage
    if (!hasCloudinary || !fileUrl.startsWith("http")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;
    }

    return res.status(200).json({
      success: true,
      message: "PDF uploaded successfully",
      data: {
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        filename: req.file.filename,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to upload PDF.",
    });
  }
};
