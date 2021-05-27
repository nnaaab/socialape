const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();


const config = {
  apiKey: "AIzaSyDrkJIpJ_CgwWEgdV1jWeYVibZkV1Lljc0",
  authDomain: "socialape-41329.firebaseapp.com",
  projectId: "socialape-41329",
  storageBucket: "socialape-41329.appspot.com",
  messagingSenderId: "1041462219408",
  appId: "1:1041462219408:web:7e5a57f2dd85173d5bfe15",
  measurementId: "G-ZSDH4PJVTZ"
};

const firebase = require("firebase");
const e = require("express");
firebase.initializeApp(config);
const app = require("express")();

const db = admin.firestore();

app.get('/screams',(req,res) => {
  db
    .collection('screams')
    .orderBy('createdAt','desc')
    .get()
    .then((data) => {
      // console.log('origin res, req',res,req);
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId:doc.id,
          body:doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err));
})

app.post('/scream',(req,res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db
    .collection('screams')
    .add(newScream)
    .then((doc) => {
      res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
      res.status(500).json({error: 'something went wrong'});
      console.error(err);
    });

});

const isEmail = (email) => {
  const regEx =  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(regEx)) return true;
  else return false;
}
  
const isEmpty = (string) => {
  if(string.trim() === '') return true;
  else return false;
}

//sign up route
app.post('/signup',(req,res) => {
  const newUser = {
    email:req.body.email,
    password:req.body.password,
    confirmPassword:req.body.confirmPassword,
    handle:req.body.handle 
  };

  let errors = {};

  if(isEmpty(newUser.email)) {
    errors.email = 'Must not be empty'
  } else if(!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address'
  }

  if(isEmpty(newUser.password)) errors.password = 'Must not empty'
  if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
  if(isEmpty(newUser.handle)) errors.handle = 'Must not empty'

  if(Object.keys(errors).length > 0) return res.status(400).json(errors);
  

  

  //validate data
  let token,userId;
  db.doc(`/users/${newUser.handle}`).get()
    .then(doc=>{
      if(doc.exists){
        return res.status(400).json({handle:`this handle is already taken`});
      } else {
        return firebase
          .auth().createUserWithEmailAndPassword(newUser.email,newUser.password);
      }
    })
    //user have created, get user's token
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    //store new user's info to the dataset for later duplicate handle check 
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({token});
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({email: 'Email is already in use'})
      } else {
        return res.status(500).json({error:err.code});
      }
    })
});

app.post('/login',(req,res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};

  if(isEmpty(user.email)) errors.email = 'Must not be empty';
  if(isEmpty(user.password)) errors.password = 'Must not be empty';

  if(Object.keys(errors).length > 0 ) return res.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email,user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({token});
    })
    .catch(err => {
      if(err.code === 'auth/wrong-password'){
        return res.status(403).json({general: 'Wrong credentials, please try again'});
      } else return res.status(500).json({error: err.code});
    });
});

exports.app = functions.https.onRequest(app);