import multer from "multer";

// Difference between memory storage and disk storage in multer:
// - memoryStorage: Stores files in memory as Buffer objects, not saved to disk. Suitable for small files that need fast, temporary access or further processing before being persisted elsewhere (e.g., uploading to cloud storage). Files are lost if the server restarts.
// - diskStorage: Saves files directly to the server's filesystem at a specified destination and filename. Useful when you want to persist uploaded files locally. Requires disk cleanup and proper file management on the server.
const storage = multer.memoryStorage();
const uploadFile = multer({ storage }).single("file");



export default uploadFile;


