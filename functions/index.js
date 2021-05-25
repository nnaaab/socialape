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
firebase.initializeApp(config);
const app = require("express")();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

app.get('/screams',(req,res) => {
  admin
  .firestore()
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

exports.getScreams = functions.https.onRequest((req,res) => {
  admin
    .firestore()
    .collection('screams')
    .get()
    .then((data) => {
      // console.log('origin res, req',res,req);
      let screams = [];
      data.forEach((doc) => {
        screams.push(doc.data());
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err));
});


app.post('/scream',(req,res) => {
  // if (req.method !== 'POST') {
  //   return res.status(400).json({err: 'Method not allowed'});
  // }
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  admin
  .firestore()
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

//sign up route
app.post('/signup',(req,res) => {
  const newUser = {
    email:req.body.email,
    password:req.body.password,
    confirmPassword:req.body.confirmPassword,
    handle:req.body.handle
  };

  //validate data
  firebase.auth().createUserWithEmailAndPassword(newUser.email,newUser.password)
    .then((data) => {
      return res.status(201).json({message: `user ${data.user.uid} signed up successfully`});
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({error: error.code});
    });
});



exports.app = functions.https.onRequest(app);