const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const admin = require("firebase-admin");

const serviceAccount = require("./habit-tracker-3cdcd-firebase-adminsdk.json");
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyUser = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ message: "Unauthorized access: Authorization header missing" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({
      message:
        "Unauthorized access: Bearer token is malformed or not provided.",
    });
  }
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.buyer_email = userInfo.email;
    next();
  } catch (error) {
    res.status(401).send({ message: "unauthorized access" });
  }
};

async function run() {
  try {
    // await client.connect();
    const db = client.db("habit-tracker-db");
    const habitCollection = db.collection("habit-info");

    app.get("/my-habit/dashboard", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.status(400).json({ message: "Email query missing" });
      }

      try {
        const result = await habitCollection
          .aggregate([
            { $match: { userEmail: email } },
            {
              $group: {
                _id: null, // total stats
                totalHabits: { $sum: 1 },
                completedHabits: {
                  $sum: {
                    $cond: [
                      { $gt: [{ $size: "$completionHistory" }, 0] },
                      1,
                      0,
                    ],
                  },
                },
                pendingHabits: {
                  $sum: {
                    $cond: [
                      { $eq: [{ $size: "$completionHistory" }, 0] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
          .toArray();

        const categoryStats = await habitCollection
          .aggregate([
            { $match: { userEmail: email } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ])
          .toArray();

        res.status(200).json({
          overview: result[0] || {},
          categoryStats,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.get("/dashboard/category-status", async (req, res) => {
      try {
        const categoryStatus = await habitCollection
          .aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
          .toArray();
        res.status(200).json(categoryStatus);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.get("/popular-habit", async (req, res) => {
      try {
        const popularHabit = await habitCollection
          .aggregate([
            {
              $addFields: {
                completedCount: { $size: "$completionHistory" },
              },
            },
            {
              $sort: { completedCount: -1 },
            },
            {
              $limit: 5,
            },
          ])
          .toArray();
        res.status(200).json(popularHabit);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
      }
    });

    app.get("/weekly-summary", async (req, res) => {
      try {
        const today = new Date();

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(today.getDate() - i);
          return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        });

        const habits = await habitCollection.find({}).toArray();

        const weeklyData = habits.map((habit) => {
          const completedThisWeek = habit.completionHistory.filter((date) =>
            last7Days.includes(date)
          );
          return {
            title: habit.title,
            category: habit.category,
            completedThisWeek,
            streak: completedThisWeek.length,
          };
        });

        res.status(200).json({ weeklyData, last7Days });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong" });
      }
    });

    app.get("/habit-info", async (req, res) => {
      const result = await habitCollection
        .find()
        .sort({ createAt: 1 })
        .toArray();
      res.send(result);
    });

    app.get("/habit-latest", async (req, res) => {
      const result = await habitCollection
        .find()
        .sort({ createAt: 1 })
        .limit(8)
        .toArray();
      res.send(result);
    });

    app.get("/habit-info/:id", async (req, res) => {
      const id = req.params.id;
      const query = {};
      if (id) {
        query._id = new ObjectId(id);
      }
      try {
        const result = await habitCollection.findOne(query);
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.get("/mark-complete/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const userEmail = req.query.userEmail;
        console.log(userEmail);
        const habit = await habitCollection.findOne({ _id: new ObjectId(id) });
        if (!habit) {
          return res.status(404).send({ message: "Habit not found" });
        }
        // if (habit.userEmail !== userEmail) {
        //   return res
        //     .status(400)
        //     .send({ message: "You are not allowed to mark this habit" });
        // }
        // console.log(habit);
        const today = new Date().toLocaleDateString();
        if (habit.completionHistory.includes(today)) {
          return res
            .status(400)
            .send({ message: "Already marked complete today" });
        }
        const result = await habitCollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { completionHistory: today } }
        );
        res.send({
          message: "Habit marked as complete successfully!",
          habit: result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error", error });
      }
    });

    app.get("/habit-category", async (req, res) => {
      const category = req.query.category;
      console.log(category);
      const query = { category: category };
      const result = await habitCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/habit-search", async (req, res) => {
      const search = req.query.search;
      // console.log(search);
      const query = { title: { $regex: search, $options: "i" } };
      const result = await habitCollection.find(query).toArray();
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

    app.patch("/habit-info/:id", async (req, res) => {
      const id = req.params.id;
      const newData = req.body;
      const query = {};
      if (id) {
        query._id = new ObjectId(id);
      }
      const update = {
        $set: newData,
      };
      try {
        const result = await habitCollection.updateOne(query, update);
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.delete("/habit-info/:id", verifyUser, async (req, res) => {
      const buyer_email = req.buyer_email;
      const userEmail = req.query.email;
      console.log("User email ", userEmail);
      console.log(buyer_email);
      if (buyer_email !== userEmail) {
        return res.status(403).send({
          message:
            "Access Forbidden: You are not authorized to access this resource",
        });
      }
      const id = req.params.id;
      const query = {};
      if (id) {
        query._id = new ObjectId(id);
      }

      try {
        const result = await habitCollection.deleteOne(query);
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // await client.db("admin").command({ ping: 1 });
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
