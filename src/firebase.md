# `Firebase`

The refernce repo for this project is [here](https://github.com/stevekinney/think-piece)

## `Cloud Firestore vs Realtime database`

- designed for scalability(in beta)
- realtime database might be cheaper if you're doing a ton of read and write queries but generally speaking cloud firestore is likely a better bet

### `The Structure of Cloud Firestore`

Cloud Firestore is based on Collections

- users
- workouts
- history etc
  broken out vs real time database at giant json structure.

In a real time datavase you get whatever node of the tree you need and all of it's subnodes which is much more data. In Cloud firestore queries are shallow, you don't get all of the sub-collections by default.

```js
firestore.collection("posts"); // grab collection of all posts
firestore.collection("posts").doc("sgoIdfI70uZ4Tdp1"); // grab specific post
firestore
  .collection("posts")
  .doc("sgoIdfI70uZ4Tdp1")
  .collection("comments"); // grab sub collection comments of specific post

// shorthand
firestore.collection("posts/sgoIdfI70uZ4Tdp1/comments"); // grab sub collection comments of specific post
firestore.collection("posts/sgoIdfI70uZ4Tdp1/comments/fkdasfji4ej930ff"); // specific comment of comments
```

another nice feature of firestore is it provides some `SQL-lite` querying and ordering.

```js
// Ordering
firestore.collection("posts").orderBy("createdAt", "desc");

// Limiting
firestore.collection("posts").limit(10);

// Querying
firestore.collection("posts").where("stars", ">=", 10);
```

## `Firebase`

Let's setup our project and create a `firebase.js` file

```js
import firebase from "firebase/app";

var firebaseConfig = {
  apiKey: "AIzaSyC07VNK5to4h2iQUrEHZutjEry9PrDVzf8",
  authDomain: "think-piece-76b6c.firebaseapp.com",
  databaseURL: "https://think-piece-76b6c.firebaseio.com",
  projectId: "think-piece-76b6c",
  storageBucket: "think-piece-76b6c.appspot.com",
  messagingSenderId: "114444747470",
  appId: "1:114444747470:web:90e695f24904bbc916c69f",
  measurementId: "G-TRX1ZYY1YS"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

window.firebase = firebase;
export default firebase;
```

Then we will set up our database with firestore and start in `test` mode. Then we add the import to our `firebase.js`

```js
import firebase from "firebase/app";
import 'firebase/firestore';

...

export const firestore = firebase.firestore();
window.firebase = firebase; // for development purposes and testing
export default firebase;
```

and let's call that file in `Application.jsx` and call our database

```js
// Application.jsx
import { firestore } from "../firebase";

componentDidMount = () => {
  const posts = firestore
    .collection("posts")
    .get()
    .then(snapshot => {
      console.log(snapshot);
    });
};
```

where we get back a query snapshot of our database of `posts`.

Query SnapShot properties include

- docs: All of the documents in the snapshot
- empty: This is a boolean that lets us know if the snapshot was empty
- metadata: metadata about this snapshot, concerning its source and if it has local modifications.
- query: a reference to the query that you fires
- size: The number of documents in the QuerySnapshot

and also has methods

- docChanges(): An array of the changes since the last snapshot
- forEach(): iterates over entire array of snapshots
- isEqual(): Let's you know if it matches another snapshot

QuerySnapshots typically hold onto a number of QueryDocumentSnapShots, which inherit from DocumentSnapshot.

DocumentSnapshot Properties:

- id: The id of the given document
- exists: is this even a thing in the database?
- metadata: Pretty much the same as QuerySnapshot above
- ref: A reference to the documents location in the database

DocumentSnapshot Methods:

- data(): Gets all of the fields of the object
- get(): Allows you to access a particular property on the object
- isEqual(): Useful for comparisions

Let's add a `posts` collection in firebase and then change our `Application.jsx` to read those posts

```js
componentDidMount = async () => {
  const snapshot = await firestore.collection("posts").get();
  snapshot.forEach(doc => {
    const id = doc.id;
    const data = doc.data();

    console.log({ id, data });
  });
};
```

We want to render those on our page so we can change our `componentDidMount` and use the `doc.data` method to grab our data.

```js
componentDidMount = async () => {
  const snapshot = await firestore.collection("posts").get();
  const posts = snapshot.docs.map(doc => {
    return { id: doc.id, ...doc.data() };
  });

  this.setState({ posts });
};
```

and boom our page loads with our posts loaded in! Let's create a `utilites.js` so we don't always need to re-write that method to get our posts! Let's also remove the fake data in `Application.js`

```js
// utilities.js
export const collectIdsAndDocs = doc => {
  return { id: doc.id, ...doc.data() };
};

// Application.jsx
...
import { collectIdsAndDocs } from "../utilities";

class Application extends Component {
  state = {
    posts: []
  };

  componentDidMount = async () => {
    const snapshot = await firestore.collection("posts").get();
    const posts = snapshot.docs.map(collectIdsAndDocs);

    this.setState({ posts });
  };
  ...
}
```

Now let's add a post to our firestore collection! Let's modify our `handleCreate` function likeso

```js
// Application.jsx
handleCreate = async post => {
  const { posts } = this.state;

  const docRef = await firestore.collection("posts").add(post);
  const doc = await docRef.get();

  const newPost = collectIdsAndDocs(doc);
  this.setState({ posts: [newPost, ...posts] });
};
```

but now we need to also be able to remove a post! Let's add a `handleRemove` function to `Application.jsx`

```js
// Application.jsx
handleRemove = async id => {
  const allPosts = this.state.posts;

  const posts = allPosts.filter(post => post.id !== id);
  this.setState({ posts });
};

render() {
  const { posts } = this.state;

  return (
    <main className="Application">
      <h1>Think Piece</h1>
      <Posts
        posts={posts}
        onCreate={this.handleCreate}
        onRemove={this.handleRemove}
      />
    </main>
  );
}


// Posts.jsx
const Posts = ({ posts, onCreate, onRemove }) => {
  ...
  <Post {...post} key={post.id} onRemove={onRemove} />
  ...
}

// Post.jsx
const Post = ({ title, content, id, user, createdAt, stars, comments, onRemove}) => {
  ...
  <button className="delete" onClick={() => onRemove(id)}>
    Delete
  </button>
}
```

where we see it deleted! but it is just deleted from the state it is not deleting it from our store, to do that we change our `handleRemove` to be

```js
// Application.jsx
handleRemove = async id => {
  const allPosts = this.state.posts;

  await firestore.doc(`posts/${id}`).delete();
  const posts = allPosts.filter(post => post.id !== id);
  this.setState({ posts });
};
```

and if you refresh they are completely gone! But we don't wanna refresh each time! Let's update our UI so it will always refresh when the database changes! We can do that with the `onSnapshot` function which will allow us to listen to changes on the snapshots

```js
// Application.jsx
unsubscribe = null;

componentDidMount = async () => {
  this.unsubscribe = firestore.collection("posts").onSnapshot(snapshot => {
    const posts = snapshot.docs.map(collectIdsAndDocs);
    this.setState({ posts });
  });
};

componentWillUnmount = () => {
  this.unsubscribe(); // will unsubscribe us from changes when our component is not rendered
};
```

if you have 2 instances open you'll see adding a post to 1 will automatically update the other! Now we can also clean up code in other places since we are always watching for changes

```js
// Application.jsx
handleCreate = post => {
  firestore.collection("posts").add(post);
};

handleRemove = async id => {
  firestore.doc(`posts/${id}`).delete();
};
```

as these cause changes to the collecton so our `onSnapshot` will run and set our state for us! Also now that firebase is in control we can move our functions to the components themselves!

```js
// Posts.jsx
<section className="Posts">
  <AddPost />
  {posts.map(post => (
    <Post {...post} key={post.id} />
  ))}
</section>
// Post.jsx
const postRef = firestore.doc(`posts/${id}`);
const remove = () => postRef.delete();
...
<button className="delete" onClick={remove}>
  Delete
</button>

// AddPost.jsx
handleSubmit = event => {
  ...
  firestore.collection("posts").add(post);
  this.setState({ title: "", content: "" });
};
```

and remove the `handleCreate` and `handleRemove` functions from our `Application.jsx`. Let's be able to star our post! Lets add the `star` function to the `Post.jsx`.

```js
// Post.jsx
...
const star = () => postRef.update({ stars: stars + 1 });
...
<button className="star" onClick={star}>
  Star
</button>
```

## OAuth

Let's set up some OAuth! Let's start with the google account! Enable `Email/Password` and `Google` auth in your firebase console! Let's change our Application to be

```js
// Application.jsx
state = {
  posts: [],
  user: null
};
...
<main className="Application">
  <h1>Think Piece</h1>
  <Authentication user={user} />
  <Posts posts={posts} />
</main>;
```

and add `auth` to our firebase.js file and add the signInWithGoogle to our `SingIn.jsx`

```js
import "firebase/auth";
...
export const auth = firebase.auth();

export const provider = new firebase.auth.GoogleAuthProvider();
export const signInWithGooogle = auth.signInWithGooogle(provider);

// SingIn.jsx
import { signInWithGooogle } from "../firebase";
...
<button onClick={signInWithGooogle}>Sign In With Google</button>
```

and set up our application to check for sign ins and sign out

```js
// Application.jsx
import { firestore, auth } from "../firebase";

unsubscribeFromAuth = null;

componentDidMount = async () => {
  this.unsubscribe = firestore.collection("posts").onSnapshot(snapshot => {
    const posts = snapshot.docs.map(collectIdsAndDocs);
    this.setState({ posts });
  });
  this.unsubscribeFromAuth = auth.onAuthStateChanged(user => {
    this.setState({ user });
  });
};

// Authentication.jsx
const Authentication = ({ user, loading }) => {
  if (loading) return null;

  return <div>{user ? <CurrentUser {...user} /> : <SignInAndSignUp />}</div>;
};
```

which will look for our sign in. Now we add sing Out! We can add the `auth.signOut` const in `firebase.js`

```js
// firebase.js
export const signOut = () => auth.signOut();

// CurrentUser.jsx
import { signOut } from "../firebase";
...
<button onClick={signOut}>Sign Out</button>
```

and we can sing in and sign out easily! This might be trouble though so maybe we want some securiy rules! Everything is blacklisted by defualt and read and write are broken into

read:

- get
- list

write:

- create
- update
- delete

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      match /comments/{comment} {
        allow read, write: if <condtion>;
      }
    }
  }
}

service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read, write: if request.auth.uid != null; // read and write if logged in
    }
  }
}

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth.id == userId;
      allow create: if request.auth.uid != null;
    }
  }
}
```

`resource.data` will have the fields on the document as it is stored in the database. `request.resource.data` will have incoming documnets. Requests other documents with `exists(...)` and `get(...)`. By default with our test setup we have

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write;
    }

```

which allows anyone to read and write. Let's make it so you must be logged in to make a post

```
service cloud.firestore {
  match /databases/{database}/documents {
		match /posts/{postId} {
    	allow read;
      allow write: if request.auth.uid != null;
    }
  }
}
```

now let's make it so only users can delete their own posts

```
service cloud.firestore {
  match /databases/{database}/documents {
		match /posts/{postId} {
    	allow read;
      allow create, update: if request.auth.uid != null;
      allow delete: if request.auth.uid == resource.data.user.uid;
    }
  }
}
```

and then in our `AddPost.jsx`

```js
import { firestore, auth } from "../firebase";
...
handleSubmit = event => {
  event.preventDefault();

  const { title, content } = this.state;
  const { uid, displayName, email, photoURL } = auth.currentUser || [];
  const post = {
    title,
    content,
    user: {
      uid,
      displayName,
      email,
      photoURL
    },
    favorites: 0,
    comments: 0,
    createdAt: new Date()
  };

  firestore.collection("posts").add(post);

  this.setState({ title: "", content: "" });
};
```

and boom only when logged in can you delete a post and you can only delete your own post! Let's add a check to ensure title cannot be null! To do so change the security check to be

```
service cloud.firestore {
  match /databases/{database}/documents {
		match /posts/{postId} {
    	allow read;
      allow create, update: if request.auth.uid != null && request.resource.data.title != '';
      allow delete: if request.auth.uid == resource.data.user.uid;
    }
  }
}
```

## `Sign Up`

We have google log in but what if they sign up with an email and password but some things like the picture are not given to use by that method! Let's first modify our `SignUp.jsx`;

```js
// SignUp.jsx
import { auth } from "../firebase";
...
handleSubmit = async event => {
  event.preventDefault();

  const { email, displayName, password } = this.state;

  try {
    const { user } = await auth.createUserWithEmailAndPassword(email, password);

    user.updateProfile({ displayName }); // this won't work initally, it works after a refresh!!
  } catch (error) {
    console.error(error);
  }
  this.setState({ displayName: "", email: "", password: "" });
};
```

to fix our displayName issue we can go to our authentication so we can store user information in addition to the email and password we pass in. We also want them to be able to set a photo even for a google account! First let's change our security rules again and then to `firebase.js`!

```
match /databases/{database}/documents {
  ...
  match /users/{userId} {
    allow read;
    allow write: if request.auth.uid == userId;
  }
}
```

```js
// firebase.js
export const createUserProfileDocument = async (user, additionalData) => {
  if (!user) return;

  // Get a reference to the place in the database where the user might be
  const userRef = firestore.doc(`users/${user.uid}`);

  // Go and fetch the document from that location
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date();
    try {
      await userRef.set({
        displayName,
        email,
        photoURL,
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error(error);
    }
  }

  return getUserDocument(user.uid);
};

export const getUserDocument = async uid => {
  if (!uid) return null;
  try {
    const userDocument = await firestore
      .collection("users")
      .doc(uid)
      .get();

    return { uid, ...userDocument.data() };
  } catch (error) {
    console.error(error);
  }
};
```

```js
// SignUp.jsx
const { user } = await auth.createUserWithEmailAndPassword(email, password);

createUserProfileDocument(user, { displayName });

// Application.jsx
this.unsubscribeFromAuth = auth.onAuthStateChanged(async userAuth => {
  const user = await createUserProfileDocument(userAuth);
  this.setState({ user });
});
```

Let's create a context so everything can read from it! Lets make PostProvider.jsx

```js
import React, { Component, createContext } from "react";
import { firestore } from "../firebase";
import { collectIdsAndDocs } from "../utilities";

export const PostsContext = createContext();

class PostProvider extends Component {
  state = { posts: [] };

  unsubscribeFromFirestore = null;
  componentDidMount = () => {
    this.unsubscribe = firestore.collection("posts").onSnapshot(snapshot => {
      const posts = snapshot.docs.map(collectIdsAndDocs);
      this.setState({ posts });
    });
  };
  componentWillUnmount = () => {
    this.unsubscribeFromFirestore();
  };
  render() {
    const { posts } = this.state;
    const { children } = this.props;

    return (
      <PostsContext.Provider value={posts}>{children}</PostsContext.Provider>
    );
  }
}

export default PostProvider;
```

which will allow all of our components access to that context we just need to wrap our app around it.

```js
// index.js
import React from "react";
import { render } from "react-dom";

import "./index.scss";

import Application from "./components/Application";
import PostProvider from "./providers/PostProvider";

render(
  <PostProvider>
    <Application />
  </PostProvider>,
  document.getElementById("root")
);
```

and now we can read that context and read the posts from the context.

```js
// Posts.jsx
import React, { useContext } from "react";
import Post from "./Post";
import AddPost from "./AddPost";
import { PostsContext } from "../providers/PostProvider";

const Posts = () => {
  const posts = useContext(PostsContext);
  return (
    <section className="Posts">
      <AddPost />
      {posts.map(post => (
        <Post {...post} key={post.id} />
      ))}
    </section>
  );
};

export default Posts;
```

and we don't even need to pass our posts to that component! It also allows us to do some cleanup for our `Application.jsx` as we no longer need to pass posts. Let's make one for the user!

```js
// UserProvider.js
import React, { Component, createContext } from "react";
import { auth, createUserProfileDocument } from "../firebase";

export const UserContext = createContext();

class UserProvider extends Component {
  state = {
    user: null
  };

  unsubscribeFromAuth = null;

  componentDidMount = async () => {
    this.unsubscribeFromAuth = auth.onAuthStateChanged(async userAuth => {
      const user = await createUserProfileDocument(userAuth);
      this.setState({ user });
    });
  };

  componentWillUnmount = () => {
    this.unsubscribeFromAuth();
  };

  render() {
    const { user } = this.state;
    const { children } = this.props;
    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
  }
}

export default UserProvider;
```

which allows us to remove anything with user from our Application and in our Authentication we just read that context.

```js
// Authentication.sx
import React, { useContext } from "react";

import CurrentUser from "./CurrentUser";
import SignInAndSignUp from "./SignInAndSignUp";
import { UserContext } from "../providers/UserProvider";

const Authentication = () => {
  const user = useContext(UserContext);

  return <div>{user ? <CurrentUser {...user} /> : <SignInAndSignUp />}</div>;
};

export default Authentication;
```

## `User Permissions`

In the current instance everyone can see the delete button even for posts that they did not create, let's go about changing that!
so we change our Post to read our user

```js
// Post.jsx
const belongsToCurrentUser = (currentUser, postAuthor) => {
  if (!currentUser) return false;
  return currentUser.uid === postAuthor.uid;
};

const Post = ({ title, content, id, createdAt, user, stars, comments }) => {
  const currentUser = useContext(UserContext);
  ...
  {belongsToCurrentUser(currentUser, user) && (
    <button className="delete" onClick={remove}>
      Delete
    </button>
  )}
}
```

so only users who made that post can delete it! Let's upload some files!

```js
// UserProfile.js
import React, { Component } from "react";
import { auth } from "../firebase";
import { firestore } from "../firebase";

class UserProfile extends Component {
  state = { displayName: "" };
  imageInput = null;

  get uid() {
    return auth.currentUser.uid;
  }

  get userRef() {
    return firestore.doc(`users/${this.uid}`);
  }
  handleChange = event => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleSubmit = event => {
    event.preventDefault();
    const { displayName } = this.state;

    if (displayName) {
      this.userRef.update({ displayName });
    }
  };

  render() {
    const { displayName } = this.state;
    return (
      <section className="UserProfile">
        <form onSubmit={this.handleSubmit}>
          <input
            type="text"
            value={displayName}
            onChange={this.handleChange}
            placeholder="Display Name"
            name="displayName"
          />
          <input type="file" ref={ref => (this.imageInput = ref)} />
          <input className="update" type="submit" />
        </form>
      </section>
    );
  }
}

export default UserProfile;
```

but we want the user to be able to upload a new image! First we add storage to our firebase.js

```js
// firebase.js
import "firebase/storage";
export const storage = firebase.storage();
```

then set it up likeso in user profile

```js
// UserProfile
import { auth, storage } from "../firebase";

get file() {
  return this.imageInput && this.imageInput.files[0];
}

handleSubmit = event => {
  event.preventDefault();
  const { displayName } = this.state;

  if (displayName) {
    this.userRef.update({ displayName });
  }
  if (this.file) {
    storage
      .ref()
      .child("user-profiles")
      .child(this.uid)
      .child(this.file.name)
      .put(this.file)
      .then(response => response.ref.getDownloadURL())
      .then(photoUrl => this.userRef.update({ photoUrl }));
  }
};
```

set your security rules in firebase for storage to be

```
service firebase.storage {
  match /b/{bucket}/o {
    match /user-profiles/{userId}/{photoUrl} {
      allow read;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

and boom you can upload a new profile photo! Next we want to add a route so a user can view a specific post on a specific page.

```js
// PostPage.jsx
import React, { Component } from "react";

import Post from "./Post";
import Comments from "./Comments";
import { firestore } from "../firebase";
import { collectIdsAndDocs } from "../utilities";
import { withRouter } from "react-router-dom";

class PostPage extends Component {
  state = { post: null, comments: [] };

  get postId() {
    return this.props.match.params.id;
  }

  get postRef() {
    return firestore.doc(`posts/${this.postId}`);
  }

  get commentsRef() {
    return this.postRef.collection("comments");
  }

  unsubscribeFromPost = null;
  unsubscribeFromComments = null;

  componentDidMount = async () => {
    this.unsubscribeFromPost = this.postRef.onSnapshot(snapshot => {
      const post = collectIdsAndDocs(snapshot);
      this.setState({ post });
    });

    this.unsubscribeFromComments = this.commentsRef.onSnapshot(snapshot => {
      const comments = snapshot.docs.map(collectIdsAndDocs);
      this.setState({ comments });
    });
  };

  componentWillUnmount = () => {
    this.unsubscribeFromPost();
    this.unsubscribeFromComments();
  };

  creaetComment = comment => {
    console.log(this.commentsRef);
    this.commentsRef.add({ ...comment });
  };

  render() {
    const { post, comments } = this.state;
    return (
      <section>
        {post && <Post {...post} />}
        <Comments comments={comments} onCreate={this.creaetComment} />
      </section>
    );
  }
}

export default withRouter(PostPage);
```

add the route for `posts/:id` in application and set the link up for the title is `Post.jsx` We can create a component to get the user to any class as well!

```js
// withUser.jsx
import React from "react";
import { UserContext } from "../providers/UserProvider";

const getDisplayName = WrappedComponent => {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
};

const withUser = Component => {
  const WrappedComponent = props => {
    return (
      <UserContext.Consumer>
        {user => <Component user={user} {...props} />}
      </UserContext.Consumer>
    );
  };
  WrappedComponent.displayName = `WithUser(${getDisplayName(
    WrappedComponent
  )})`;
  return WrappedComponent;
};
export default withUser;

// PostPage.jsx
export default withRouter(withUser(PostPage));
```

## `Cloud Functions`

we are now gonna work on some cloud functions! First ensure that you run `npm install firebase-functions@latest firebase-admin@latest` to have the correct packages installed. Go to `/functions/index.js` and uncomment the `export.helloWorld` and then run `firebase deploy --only functions`. Now let's add an endpoint to get all of our posts!

```js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);

const firestore = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.getAllPosts = functions.https.onRequest(async (request, response) => {
  const snapshot = await firestore.collection("posts").get();
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  response.json({ posts });
});
```

and if we visit our url for cloud functions `/getAllPosts` we should see the returned json object! To run locally run `firebase serve --only functions` and you can see it run locally! Now let's add something that would check for changes, we can do something like replace certain words! Add `sanitize content` as an export

```
exports.sanitizeContent = functions.firestore
  .document("posts/{postId}")
  .onWrite(async change => {
    if (!change.after.exists) return;

    const { content, sanitized } = change.after.data();

    if (content && !sanitized) {
      return change.after.ref.update({
        content: content.replace(/CoffeeScript/g, "**********"),
        sanitized: true
      });
    }

    return null;
  });
```

some other real world issues we might wanna tackle is say we want to see how many comments our post has, do we wanna query all the posts and comments to just see how many? No! Let's keep track of that counter ourself!

```
exports.incrementCommentCount = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snapshot, context) => {
    const { postId } = context.params;
    const postRef = firestore.doc(`posts/${postId}`);

    const snap = await postRef.get('comments');
    const comments = snap.get('comments');

    return postRef.update({ comments: comments + 1 });
  });
```
