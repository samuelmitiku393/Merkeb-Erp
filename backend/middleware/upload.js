import multer from "multer";

// Use memory storage - files are stored in memory as Buffer objects
// This avoids filesystem issues and works well for Excel parsing
const storage = multer.memoryStorage();

// File filter: only allow Excel and CSV files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
    "application/csv",
  ];

  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const ext = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf("."));

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only .xlsx, .xls, and .csv files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
});

export default upload;
