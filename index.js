const express = require('express');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const bcrypt = require('bcryptjs'); 
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());
app.use(cookieParser());

//salehin
//salehin

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
        
            if (!password) {
                return res.status(400).send({ message: "Password is required" });
            }
        
            console.log("Received password:", password); // Debugging
        
            const existingUser = await UsersCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).send({ message: "User already exists" });
            }
        
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
            const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5d' });

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false, // Set to `true` in production for HTTPS
                })
                .send({ success: true, token });
        });

        app.post('/logout', (req, res) => {
            res.clearCookie('token').send({ success: true, message: "Logged out successfully" });
        });


        app.post('/book', verifyJWT, async (req, res) => {
            const newBook = req.body;
            console.log(newBook);
            const result = await BookCollection.insertOne(newBook);
            res.send(result)
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
