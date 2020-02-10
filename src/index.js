import React from "react";
import { render } from "react-dom";

import "./index.scss";

import Application from "./components/Application";
import PostProvider from "./providers/PostProvider";
import UserProvider from "./providers/UserProvider";
import { BrowserRouter as Router } from "react-router-dom";

render(
  <Router>
    <UserProvider>
      <PostProvider>
        <Application />
      </PostProvider>
    </UserProvider>
  </Router>,
  document.getElementById("root")
);
