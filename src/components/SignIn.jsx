import React, { Component } from "react";
import { signInWithGooogle, signIn } from "../firebase";

class SignIn extends Component {
  state = { email: "", password: "" };

  handleChange = event => {
    const { name, value } = event.target;

    this.setState({ [name]: value });
  };

  handleSubmit = event => {
    event.preventDefault();
    const { email, password } = this.state;
    console.log("email: ", email);
    console.log("password: ", password);
    signIn(email, password);
    this.setState({ email: "", password: "" });
  };

  render() {
    const { email, password } = this.state;

    return (
      <form className="SignIn" onSubmit={this.handleSubmit}>
        <h2>Sign In</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={this.handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={this.handleChange}
        />
        <input type="submit" value="Sign In" />
        <button onClick={signInWithGooogle}>Sign In With Google</button>
      </form>
    );
  }
}

export default SignIn;
