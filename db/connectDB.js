const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        console.log('database connected');
    } catch (error) {
        if (error) {
            console.log(error.message);
        }
        process.exit(1);
    }
}

module.exports = connectDB;