const React = require('react');
const { View } = require('react-native');

module.exports = function (props) {
  return React.createElement(View, { ...props, testID: 'svg-mock' });
};
