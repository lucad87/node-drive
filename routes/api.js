const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { sharedLinks, generateShareId } = require('../utils/share');
const userStore = require('../utils/userStore');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(uploadsDir, req.query.path || '');
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

router.get('/files', (req, res) => {
    const dirPath = path.join(uploadsDir, req.query.path || '');
    if (!fs.existsSync(dirPath)) {
        return res.status(404).send('Directory not found');
    }
    fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory');
        }
        const fileDataPromises = files.map(async file => {
            const itemPath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                try {
                    const subFiles = await fs.promises.readdir(itemPath, { withFileTypes: true });
                    const fileCount = subFiles.filter(subFile => subFile.isFile()).length;
                    return {
                        name: file.name,
                        isDirectory: true,
                        fileCount: fileCount
                    };
                } catch (err) {
                    console.error(`Error reading directory ${itemPath}:`, err);
                    return {
                        name: file.name,
                        isDirectory: true,
                        fileCount: 0 // Default to 0 if error
                    };
                }
            } else {
                return {
                    name: file.name,
                    isDirectory: false,
                };
            }
        });
        Promise.all(fileDataPromises)
            .then(fileData => res.json(fileData))
            .catch(err => res.status(500).send('Error processing directory contents'));
    });
});

router.post('/folders', express.json(), (req, res) => {
    const dirPath = path.join(uploadsDir, req.body.path || '', req.body.name);
    if (fs.existsSync(dirPath)) {
        return res.status(400).send('Directory already exists');
    }
    fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
            return res.status(500).send('Error creating directory');
        }
        res.status(201).send('Directory created');
    });
});

router.post('/files', upload.array('files'), (req, res) => {
    res.status(201).send('Files uploaded');
});

router.delete('/files', express.json(), (req, res) => {
    const filePath = path.join(uploadsDir, req.body.path || '', req.body.name);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    fs.rm(filePath, { recursive: true }, (err) => {
        if (err) {
            return res.status(500).send('Error deleting file or directory');
        }
        res.send('File or directory deleted');
    });
});

router.post('/share', express.json(), (req, res) => {
    const { name, path: itemPath } = req.body;
    const fullPath = path.join(uploadsDir, itemPath || '', name);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).send('File or folder not found');
    }

    const shareId = generateShareId();
    sharedLinks[shareId] = { fullPath, isDirectory: fs.statSync(fullPath).isDirectory() };
    const filenameWithExtension = path.basename(fullPath);
    const shareLink = `/shared/${shareId}/${encodeURIComponent(filenameWithExtension)}`;

    res.json({ shareLink });
});

router.get('/user-info', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isAdmin: req.user.isAdmin });
    } else {
        res.json({ isAdmin: false });
    }
});

// Admin routes
router.get('/admin/users', (req, res) => {
    // Only allow admins to access this route
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).send('Forbidden');
    }
    res.json(userStore.getAllUsers());
});

router.put('/admin/users/:id', express.json(), (req, res) => {
    // Only allow admins to access this route
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).send('Forbidden');
    }
    const userId = req.params.id;
    const updates = req.body;
    const user = userStore.findUserById(userId);

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Apply updates
    if (typeof updates.isAdmin !== 'undefined') {
        user.isAdmin = updates.isAdmin;
    }
    if (typeof updates.canAccess !== 'undefined') {
        user.canAccess = updates.canAccess;
    }
    userStore.updateUser(user);
    res.status(200).send('User updated');
});

router.post('/move', express.json(), async (req, res) => {
    const { names, currentPath: rawCurrentPath, destination } = req.body; // 'names' is now an array

    const currentPath = rawCurrentPath || ''; // Ensure currentPath is a string

    if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ message: 'No items specified for move.' });
    }

    const newDirPath = path.join(uploadsDir, destination || '');

    try {
        // Ensure destination directory exists
        if (!fs.existsSync(newDirPath)) {
            await fs.promises.mkdir(newDirPath, { recursive: true });
        }

        const results = [];
        for (const name of names) {
            if (typeof name !== 'string' || name.trim() === '') {
                results.push({ name: name, status: 'failed', message: 'Invalid item name provided.' });
                continue;
            }
            const oldPath = path.join(uploadsDir, currentPath, name);
            const newPath = path.join(newDirPath, name);

            if (!fs.existsSync(oldPath)) {
                results.push({ name, status: 'failed', message: 'Source not found.' });
                continue;
            }

            if (fs.existsSync(newPath)) {
                results.push({ name, status: 'failed', message: `An item named '${name}' already exists in the destination.` });
                continue;
            }

            try {
                await fs.promises.rename(oldPath, newPath);
                results.push({ name, status: 'success', message: `Successfully moved.` });
            } catch (err) {
                results.push({ name, status: 'failed', message: `Error moving: ${err.message}` });
            }
        }

        const allSucceeded = results.every(r => r.status === 'success');
        if (allSucceeded) {
            res.status(200).json({ message: `Successfully moved all selected items to '${destination || 'root'}'.`, results });
        } else {
            const failedItems = results.filter(r => r.status === 'failed').map(r => r.name).join(', ');
            res.status(200).json({ message: `Moved some items. Failed to move: ${failedItems}.`, results });
        }

    } catch (err) {
        console.error('Error during multi-item move operation:', err);
        res.status(500).json({ message: 'Failed to perform multi-item move.', error: err.message });
    }
});

// Download single file
router.get('/download', (req, res) => {
    const fileName = req.query.name;
    const filePath = path.join(uploadsDir, req.query.path || '', fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

// Download multiple files as a zip
const archiver = require('archiver');

router.post('/download-multiple', express.json(), async (req, res) => {
    const { names, path: currentPath } = req.body;

    if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).send('No files specified for download.');
    }

    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('error', function(err) {
        res.status(500).send({ error: err.message });
    });

    // On stream closed we can end the response.
    archive.on('end', function() {
        console.log('Archive wrote %d bytes', archive.pointer());
    });

    // set the archive name
    res.attachment('files.zip');

    // This is the pipe of data to the response.
    archive.pipe(res);

    for (const name of names) {
        const filePath = path.join(uploadsDir, currentPath || '', name);
        if (fs.existsSync(filePath)) {
            const stat = await fs.promises.stat(filePath);
            if (stat.isFile()) {
                archive.file(filePath, { name: name });
            } else if (stat.isDirectory()) {
                archive.directory(filePath, name); // Add directory recursively
            }
        } else {
            console.warn(`File or directory not found, skipping: ${filePath}`);
        }
    }

    archive.finalize();
});

module.exports = router;