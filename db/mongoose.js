require('dotenv').config()
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL, {
	useNewUrlParser: true,
	useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).catch((err) => {
    console.log("Something went wrong, cannot connection to database")
    console.log(err)
});

mongoose.connection.on("error", err => {
    console.log(err);
})

mongoose.connection.once("open", () => {
    console.log("Database connected");
})