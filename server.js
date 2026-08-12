const express = require("express");
require("dotenv").config();
const userRoute = require("./routes/userRoute");
const dbConnect = require("./config/dbConnection");

const app = express();
app.use(express.json());

// Enable CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

(async () => {
  await dbConnect();
})();

app.use("/user", userRoute);

app.listen(process.env.PORT, () => {
  console.log("server is running on port:", process.env.PORT);
});
