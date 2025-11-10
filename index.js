const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello This is a habit tracker !");
});

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.8tne59p.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("habit-tracker-db");
    const habitCollection = db.collection("habit-info");

    app.get("/habit-info", async (req, res) => {
      const result = await habitCollection.find().toArray();
      res.send(result);
    });

    app.post("/habit-info", async (req, res) => {
      const newHabit = req.body;
      const result = await habitCollection.insertOne(newHabit);
      res.send(result);
    });

    app.get("/my-habit", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      try {
        const result = await habitCollection.find(query).toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

// habit-tracker
// 5eyOpFz7kGwZPs2V
