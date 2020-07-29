//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); //mongodb
const _ = require("lodash"); //lodash

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//mongodb DB
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
//mongodb Schema
const itemSchema = {
  name: String,
};
//mongoose model
const Item = mongoose.model("Item", itemSchema);
//mongoose documents
const item1 = new Item({
  name: "1",
});
const item2 = new Item({
  name: "2",
});
const item3 = new Item({
  name: "3",
});
//put three items in an array
const defaultItems = [item1, item2, item3];

// create a new schema
const listSchema = {
  name: String,
  items: [itemSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //mongoose find()
  //in{} should be the conditions for our find
  //items contains the result we found inside item collections
  Item.find({}, function (err, items) {
    // when item collectionhas no items,
    //we insert 3 new items in there
    // redirect back to the root route
    if (items.length === 0) {
      //Moongoose insertMany()
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("inserted");
        }
      });
      res.redirect("/"); // redirect to the root
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName); //lodash

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an exist list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  //add new items
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/"); // redirect to home route
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
//Deleting Items from our ToDoList Database
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("sucessfully deleted checked item");
      }
    });
  } else {
    //findOneAndUpdate()
    // List.findOneAndUpdate({}.{},callback)
    //first {} the list we want to find
    // second{} : we wanna to update
    // pull from the items array
    // {_id:checkedItemId}: query we are going to make is pull the item which has an ID
    //that corrresponds to the checkedItemId
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
