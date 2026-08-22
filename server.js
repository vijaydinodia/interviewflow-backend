// InterviewFlow Backend Server - Active Production Database (Aiven Cloud MySQL)
const express = require("express");
require("dotenv").config();
const userRoute = require("./routes/userRoute");
const profileRoute = require("./routes/profileRoute");
const superAdminRoute = require("./routes/superAdminRoute");
const candidateRoute = require("./routes/candidateRoute");
const companyRoute = require("./routes/companyRoute");
const interviewerRoute = require("./routes/interviewerRoute");
const uploadRoute = require("./routes/uploadRoute");
const interviewRequestRoute = require("./routes/interviewRequestRoute");
const codeExecutionRoute = require("./routes/codeExecutionRoute");
const bugReportRoute = require("./routes/bugReportRoute");
const dbConnect = require("./config/dbConnection");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

(async () => {
  await dbConnect();
})();

app.use("/user", userRoute);
app.use("/users", userRoute);
app.use("/api/user", userRoute);
app.use("/api/users", userRoute);

app.use("/profile", profileRoute);
app.use("/api/profile", profileRoute);

app.use("/super-admin", superAdminRoute);
app.use("/api/super-admin", superAdminRoute);

app.use("/candidate", candidateRoute);
app.use("/api/candidate", candidateRoute);

app.use("/company", companyRoute);
app.use("/api/company", companyRoute);

app.use("/interviewer", interviewerRoute);
app.use("/api/interviewer", interviewerRoute);

app.use("/upload", uploadRoute);
app.use("/api/upload", uploadRoute);
app.use("/uploads", express.static("uploads"));

app.use("/interview-requests", interviewRequestRoute);
app.use("/api/interview-requests", interviewRequestRoute);

app.use("/code", codeExecutionRoute);
app.use("/api/code", codeExecutionRoute);

app.use("/bugs", bugReportRoute);
app.use("/api/bugs", bugReportRoute);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log("server is running on port:", process.env.PORT || 5000);
});
