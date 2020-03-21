const express = require('express');
const connectDB = require('./db/connectDB');
if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}

const app = express();
app.use(express.json());
connectDB();
app.get('/', (req, res) => {
    res.send("hello");
})
//register user route
app.use('/user', require('./routes/user'));
//auth user route
app.use('/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server started on port ${PORT}`))