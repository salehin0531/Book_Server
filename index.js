const express = require('express');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });


const uri = `mongodb+srv://salehin:${process.env.DB_PASS}@cluster0.6yzsb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);



// Create a MongoClient with a MongoClientOptions
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	
        await client.connect();
        const BookCollection = client.db('bookDB').collection('book')
        const UsersCollection = client.db('bookDB').collection('users');

        // Middleware to verify JWT
        const verifyJWT = (req, res, next) => {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).send({ message: "Unauthorized access" });
            }

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: "Forbidden access" });
                }
                req.user = decoded;
                next();
            });
        };

        // User Registration (Sign Up)
        app.post('/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if user exists
            const existingUser = await UsersCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).send({ message: "User already exists" });
            }

            // Hash password before saving
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = { name, email, password: hashedPassword };

            const result = await UsersCollection.insertOne(newUser);
            res.send(result);
        });

        // User Login
        app.post('/login', async (req, res) => {
            const { email, password } = req.body;

            const user = await UsersCollection.findOne({ email });
            if (!user) {
                return res.status(401).send({ message: "Invalid email or password" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).send({ message: "Invalid email or password" });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false, // Set to `true` in production for HTTPS
                })
                .send({ success: true, token });
        });
        app.post('/change-password', async (req, res) => {
            const { email, oldPassword, newPassword } = req.body;

            // Validate input fields
            if (!email || !oldPassword || !newPassword) {
                return res.status(400).json({ message: "All fields are required" });
            }

            // Find user by email
            const user = await UsersCollection.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }

            // Compare old password
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            console.log(isMatch);
            if (!isMatch) {
                return res.status(400).json({ message: "Old password is incorrect" });
            }

            // Hash the new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Update password in the database
            const result = await UsersCollection.updateOne(
                { email },
                { $set: { password: hashedNewPassword } }
            );

            if (result.modifiedCount > 0) {
                res.json({ success: true, message: "Password changed successfully" });
            } else {
                res.status(500).json({ message: "Password update failed" });
            }
        });


        app.post('/logout', (req, res) => {
            res.clearCookie('token').send({ success: true, message: "Logged out successfully" });
        });
        app.post('/upload-image', upload.single('image'), (req, res) => {
            if (!req.file) return res.status(400).send({ message: "No file uploaded" });

            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            res.send({ success: true, imageUrl });
        });
        app.get('/book', async (req, res) => {
            const cursor = BookCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });


        app.get('/book/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await BookCollection.findOne(query);
            res.send(result);
        })

        app.post('/book', verifyJWT, async (req, res) => {
            const newBook = req.body;
            console.log('Incoming book data:', JSON.stringify(newBook, null, 2));
            console.log('Data type of publishedYear:', typeof newBook.publishedYear);
            console.log('Raw request body:', req.body);
            const result = await BookCollection.insertOne(newBook);
            console.log('MongoDB result:', result);
            res.send(result)
        })


        app.put('/book/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };

            // Create a copy of req.body without the _id field
            const { _id, ...updateData } = req.body;

            const updatedDoc = {
                $set: updateData
            }

            const result = await BookCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        app.delete('/book/:id', verifyJWT, async (req, res) => {
            console.log('going to delete', req.params.id);
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await BookCollection.deleteOne(query);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send("Book making server is running")
})

app.listen(port, () => {
    console.log(`Book server is running in port : ${port}`);

})

// app.listen(port, () => {
//     console.log(`Book server is running in port : ${port}`);
// })
