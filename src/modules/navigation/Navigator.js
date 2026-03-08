import * as React from "react";
import { connect } from "react-redux";
import NavigatorView from "./RootNavigation";
import AuthViewContainer from "../auth/AuthViewContainer";

function App({ isLoggedIn }) {
  if (!isLoggedIn) {
    return <AuthViewContainer />;
  }

  return <NavigatorView />;
}

const mapStateToProps = (state) => ({
  isLoggedIn: state.app.isLoggedIn,
});

export default connect(mapStateToProps)(App);
