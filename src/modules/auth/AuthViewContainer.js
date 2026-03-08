// @flow
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { setLoggedIn } from '../AppState';

import AuthView from './AuthView';

const mapDispatchToProps = (dispatch) => ({
  onLogin: () => dispatch(setLoggedIn()),
});

export default compose(connect(null, mapDispatchToProps))(AuthView);
