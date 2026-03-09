import React from 'react';
import { connect } from 'react-redux';
import LinkCaregiverView from './LinkCaregiverView';

function LinkCaregiverContainer(props) {
  return <LinkCaregiverView {...props} />;
}

const mapStateToProps = (state) => ({
  // Add any state mappings if needed
});

const mapDispatchToProps = (dispatch) => ({
  // Add any dispatch mappings if needed
});

export default connect(mapStateToProps, mapDispatchToProps)(LinkCaregiverContainer);