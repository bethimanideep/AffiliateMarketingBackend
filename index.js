// app.js
const express = require("express");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const { connection, ProjectModel } = require("./db");
const cors = require("cors");
const authenticateToken = require("./middleware");

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello, this is your Express server!");
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL, // replace with your email
    pass: process.env.USER_PASS, // replace with your email password
  },
});

// Create a new project and send an email
app.post("/email", async (req, res) => {
  try {
    const { subject,content } = req.body;

    // Nodemailer options
    const mailOptions = {
      from: process.env.USER_EMAIL, // replace with your email
      to: "revanthsamhani5@gmail.com",
      subject: subject,
      text: content
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("Email sent: " + info.response);
        res.status(201).json("emailsent");
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/projects", authenticateToken,async (req, res) => {
  try {
    const { title, description, image } = req.body;

    // Validate request data
    if (!title || !description || !image) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const project = new ProjectModel(req.body);
    await project.save();

    res.status(201).json(await fetchprojects());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all projects
app.get("/projects", async (req, res) => {
  try {
    res.json(await fetchprojects());
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT route to update a project
app.put("/projects/:projectId", authenticateToken,async (req, res) => {
  try {

    const { title, description, image } = req.body;
    console.log(title+"inroute");
    const projectId = req.params.projectId;
    // Find the project by ID
    const project = await ProjectModel.findById({ _id: projectId });
    if (!project) return res.json({ message: "Project Not Found" });

    // Update project properties if they are provided in the request body
    if (title) project.title = title;
    if (description) project.description = description;
    if (image) project.image = image;

    // Save the updated project
    await project.save();

    res.json(await fetchprojects());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle user authentication and JWT generation
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the provided credentials match the predefined values
  if (email === "revanth@gmail.com" && password === "revanth") {
    // If the credentials are valid, generate a JWT
    const token = jwt.sign({ email,password }, process.env.SECRETKEY, { expiresIn: "1h" });

    // Send the generated token to the client
    res.json({ token });
  } else {
    // If the credentials are invalid, return an error response
    res.status(401).json({ error: "Invalid credentials" });
  }
});



// Route to delete a project by _id
app.delete('/projects/:projectId',authenticateToken, async (req, res) => {
  const projectId = req.params.projectId;

  try {
    // Use the Project model to find and remove the document by _id
    const result = await ProjectModel.findByIdAndDelete(projectId);

    if (result) {
      res.json(await fetchprojects());
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




async function fetchprojects() {
  return await ProjectModel.find();
}

// Start the server
app.listen(port, async () => {
  try {
    await connection;
    console.log("connected to db");
  } catch (error) {
    console.log(error);
  }
  console.log(`Server is running on port ${port}`);
});
