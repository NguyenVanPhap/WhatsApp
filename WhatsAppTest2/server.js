import express from 'express'
import mongoose from 'mongoose'
import Messages from "./dbMessages.js"
import User from "./dbUsers.js"
import Group from "./dbGroups.js"
import Pusher from "pusher";
import cors from "cors";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import bodyParser from "body-parser";
const jsonParser = bodyParser.json();

const app = express();

const pusher = new Pusher({
  appId: '1079448',
  key: '9c95e4aeec1860dcb3fb',
  secret: '5872d25d9560a1e80f88',
  cluster: 'ap2',
  encrypted: true
});
//middleware
app.use(express.json());
app.use(cors());

//DB config 
const connection_url='mongodb+srv://vanphap:123@cluster0.1rqvq.mongodb.net/WhatsAppDemo?retryWrites=true&w=majority'
//const connection_url='mongodb://localhost:27017/WhatsApp'
mongoose.connect(connection_url,
  {
    useCreateIndex:true,
    useNewUrlParser :true,
    useUnifiedTopology: true
  })
// pusher
const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log(change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("message", "inserted", {
                sender: messageDetails.sender,
                message: messageDetails.message,
                // timestamp: messageDetails.timestamp,
                // recieved: messageDetails.recieved,
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
}); 
                                      //API ROUTE ///
                                      
/////////////////////////  MESSAGE ///////////////////////////////////
app.get('/', (req, res) => res.send('Its working!'));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
      if (err) {
          res.status(500).send(err);
      } else {
          res.status(200).send(data);
      }
  });
});
app.post('/messages/new',(req,res)=>
{
  const dbMessage=req.body
  Messages.create(dbMessage,(err,data)=>{
    if(err)
    {
      res.status(500).send(" Lỗi rồi "+err)
    }
    else
    {
      res.status(201).send(data)
    }
  })
})

app.listen(process.env.PORT || 3333, function(){
    console.log('now listening for requests');
 });

/////////////////////////////////User///////////////////////////////////////// 
const SECURITY_KEY = 'D73373D9B4ED6FEC5B8B2DAF6WA929B1C7D14CDC88B196EBDCCEA77AFF7BB9'
const generateToken = (n) => {
  const randomToken = require('random-token').create(SECURITY_KEY);
  return randomToken(n);
}
app.post('/user/register', jsonParser, (req, res) => {
  const {name, password, email} = req.body;
  User.findOne({email}, (err, user) => {
      if(err) res.status(500).json("Error has occured. Please refresh page")
      else if(user) res.status(400).json("Email has been token.")
      else{
              const token = generateToken(25);
              const newUser = new User({name, password, email, token});
              newUser.save()
              .then(() => {
                  res.json({"Message": "Success", token});
              })
              .catch(err => res.status(500).json(err));
          }
      })
  }
)


app.post('/user/get_all_email_users', jsonParser, (req, res) => {
  if(!req.body.key) res.status(403).json("Permission denied.")
  else{
      const key = req.body.key;
      if(key !== SECURITY_KEY) res.status(403).json("Permission denied.")
      else{
          User.find({})
          .then(users => {
              let name = []
              users.forEach(user => {
                  name.push(user.email)
              })
              res.json(name);
          })
          .catch(err => res.status(500).json("Error: "+err));
      }
  }
})

app.post('/login', jsonParser, (req, res) => {
  const {email, password} = req.body;
  User.findOne({email}, (err, user) => {
      if(err) res.status(500).json("Error has occured.");
      else if(!user) res.status(400).json("User not found");
      else{
        if(password!=user.password) res.status(400).json("Incorrect password")
        else{
          const token = generateToken(25);
          user.token = token;
          user.save();
          res.json({"message": "Success", token});
        }
          
      }
  })
})
app.post('/user/update', jsonParser, (req, res) => {
  const token = req.body.token;
  if(!token) res.status(403).json("Permission denied.")
  else{
      User.findOne({token: token, email: req.body.email}, (err, user) => {
          if(err) res.status(500).json("Something went wrong.")
          else if(!user) res.status(404).json("User not found.")
          else{
              const token = generateToken();
              user.token = token;
              user.email = req.body.new_email;
              user.name = req.body.name;
              user.save()
              .then(() => res.json({message:"Updated", user}))
              .catch(err => res.status(500).json(err));
          }
      })
  }
})
app.post('/user/get_all_users_email', jsonParser, (req, res) => {
  if(!req.body.key) res.status(403).json("Permission denied.")
  else{
      const key = req.body.key;
      if(key !== SECURITY_KEY) res.status(403).json("Permission denied.")
      else{
          User.find({})
          .then(users => {
              let name = []
              users.forEach(user => {
                  name.push(user.email)
              })
              res.json(name);
          })
          .catch(err => res.status(500).json("Error: "+err));
      }
  }
})
app.post('/user/get_all_users', jsonParser, (req, res) => {
  if(!req.body.key) res.status(403).json("Permission denied.")
  else{
      const key = req.body.key;
      if(key !== SECURITY_KEY) res.status(403).json("Permission denied.")
      else{
          User.find((err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
      }
  }
})



// ///////////////////////////////////GROUP/////////////////////////////////////////////

app.post('/group/create', jsonParser, (req, res) => {
  const {owner, token, name, member} = req.body;
  User.findOne({_id: owner, token}, (err, user) => {
      if(err) res.status(500).json("Something went wrong.")
      else if(!user) res.status(403).json("Permission denied.")
      else{
          const code = generateToken(25);
          const group = new Group({admin: owner, name, code, member})
          group.save()
          .then(() => {
              member.forEach(_member => {
                  User.findOne({email: _member})
                  .then(user => {user.communication.push(group._id); user.save()})
              })
              user.communication.push(group._id)
              user.save()
              .then(() => res.json({message: "Group created.", group}))
          })
          .catch((err) => res.status(500).json(err))
      }
  })
})


app.post('/group/addmember', jsonParser, (req, res) => {
  const {token, owner, member, group} = req.body;
  User.findOne({_id: owner, token}, (err, user) => {
      if(err) res.status(500).json("Something went wrong 1.")
      else if(!user) res.status(403).json("Permission denied.")
      else{
          Group.findOne({_id: group}, (err, group) => {
              if(err) res.status(500).json("Something went wrong 2.")
              else if(!group) res.status(404).json("Group not found.")
              else{
                  let groupId = group._id;
                  User.findOne({email: member}, (err, user) => {
                      if(err) res.status(500).json("Something went wrong 3.")
                      else if(!user) res.status(404).json("Member not found")
                      else{
                          const addCommunication = new Promise((resolve, reject) => {
                              member.forEach((_member, index, array) => {
                                  User.findOne({email: _member})
                                  .then(user => {
                                      user.communication.push(groupId)
                                      user.save()
                                      .then(() => {if(index === array.length - 1) resolve()})
                                  })
                              })
                          })
                          addCommunication
                          .then(() =>{
                              for(let i = 0; i< member.length; i++){
                                  group.member.push(member[i])
                              }
                              group.save()
                              .then(() => {res.json({message:"Success", group})})
                              .catch(() => res.status(500).json("Something went wrong."))      
                          })
                      }
                  })
              }
          })
      }
  })
})


const deleteElement = (initial, value) => {
  var newArray = [];
  for(let i = 0; i< initial.length; i++){
      if(String(initial[i]) !== String(value)){
          newArray.push(initial[i])
      }
  }
  return newArray;
}
app.post('/group/remove_member', jsonParser, (req, res) => {
  const {group, token, member} = req.body;
  Group.findOne({_id: group})
  .then(group => {
      User.findOne({_id: group.admin, token})
      .then(user => {
          if(group.member.includes(member)){
              const deleteCommunications = new Promise((resolve, reject) => {
                  User.findOne({email: member})
                  .then(user => {
                      user.communication = deleteElement(user.communication, group._id)
                      user.save()
                      .then(() => resolve())
                  })
              })
              deleteCommunications
              .then(() => {
                  group.member = deleteElement(group.member, member)
                  group.save()
                  .then(() => res.json({group, message: "Success"}))
              })
              .catch(() => res.status(500).json("Something went wrong."))
          }
          else res.status(400).json("Something went wrong.")
      })
      .catch(() => res.status(403).json("Permission denied."))
  })
  .catch(() => res.status(500).json("Something went wrong."))
})

