const express = require('express');
const dotenv = require('dotenv').config();
const app = express();
const userRoute = require('./routes/userRoutes');

const PORT = process.env.PORT || 5000;

app.use(express.json())
app.use("/api", userRoute);

app.listen(PORT, () => {
    console.log(`Server running, http://localhost:${PORT}`)
});

 