const express = require('express');
const port = 8000;
const app = express();
const db = require('./config/db'); // Ensure your DB connection is properly set up
const user = require('./models/usermodel'); // Ensure your user model is correctly defined
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.set("view engine", 'ejs');

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileUpload = multer({ storage: storage }).single("avatar");

// Middleware
app.use(express.urlencoded({ extended: true }));

// Routes
// View all records
app.get("/", (req, res) => {
    user.find({})
        .then(data => {
            res.render('view', { record: data });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        });
});

// Render form to add a new record
app.get('/add', (req, res) => {
    res.render('add');
});

// Insert record
app.post('/insertrecord', fileUpload, (req, res) => {
    const { book_name, book_price, book_pages, book_author } = req.body;
    user.create({
        book_name,
        book_price,
        book_pages,
        book_author,
        image: req.file ? req.file.path : null,
    })
    .then(() => {
        console.log("Record added");
        return res.redirect("/");
    })
    .catch(err => {
        console.log(err);
        return res.status(500).send("Error adding record");
    });
});

// Render form to edit a record
app.get('/editrecord', (req, res) => {
    const id = req.query.id;
    user.findById(id)
        .then(single => {
            res.render("edit", { data: single });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send("Error fetching record");
        });
});

// Update record
app.post('/updaterecord', fileUpload, (req, res) => {
    const { editid, book_name, book_price, book_pages, book_author } = req.body;

    user.findById(editid)
        .then(single => {
            // Delete the old image if a new one is uploaded
            if (req.file) {
                fs.unlink(single.image, err => {
                    if (err) console.log(err);
                });
            }

            return user.findByIdAndUpdate(editid, {
                book_name,
                book_price,
                book_pages,
                book_author,
                image: req.file ? req.file.path : single.image,
            });
        })
        .then(() => {
            console.log("Record updated");
            return res.redirect("/");
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send("Error updating record");
        });
});

// Delete record
app.get('/deleterecord', (req, res) => {
    const id = req.query.deleteid;
    user.findById(id)
        .then(single => {
            if (single.image) {
                fs.unlink(single.image, err => {
                    if (err) console.log(err);
                });
            }
            return user.findByIdAndDelete(id);
        })
        .then(() => {
            console.log("Record deleted");
            return res.redirect("/");
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send("Error deleting record");
        });
});

// Start server
app.listen(port, err => {
    if (err) {
        console.log(err);
        return false;
    }
    console.log(`Server started on port ${port}`);
});
