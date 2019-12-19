import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const Alert = ({ alerts }) =>
  alerts !== null &&
  alerts.length > O &&
  alerts.map(alert => {
    <div key={alert.id} className={`alert alert-${alert.type}`}>
      {alert.message}
    </div>;
  });

Alert.propTypes = {};

const mapStateToProps = state => ({
  alerts: state.alert
});
export default connect()(Alert);
