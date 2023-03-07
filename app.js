//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};


//mongoose.connect(process.env.MONGO_URI , {useNewUrlParser: true, useUnifiedTopology: true});



const itemSchema = new mongoose.Schema({
  name: String
})


const Item = mongoose.model('Item', itemSchema)

const item1 = new Item({
  name: "Welcome to your todolist!"

});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema)




app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0)  {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log("error");
        } else {
          console.log("Successfully saved default items to database");
     }
  });
    res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

    
 });

});

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList) {
      if (!err) {
        if (!foundList) {
          // Create a new list

          const list = new List({
            name: customListName,
            items: defaultItems
          });
      
          list.save();
          res.render("/" + customListName);

        
        } else {
          //show the existing list
          res.render("list", {
            listTitle: foundList.name, 
            newListItems: foundList.items
          });
          
        }
      }
      
    });



});



app.post("/", function(req, res){

  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item({
     name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }




});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(!err) {
        console.log("Successfully deleted checked item.")
        res.redirect("/");
      } 
        })
  } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundItems){
          if(!err) {
            res.redirect("/" + listName);
          }
        })
      }
  });


app.get("/about", function(req, res){
  res.render("about");
});

connectDB().then(() => {
  app.listen(5000, function() {
    console.log("Server started on port 5000");
  });
});





// app.listen(5000, function() {
//   console.log("Server started on port 5000");
// });
