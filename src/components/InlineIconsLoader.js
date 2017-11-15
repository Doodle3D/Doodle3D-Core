import React from 'react';
import InlineSVG from 'react-svg-inline';
import btnColorOption from '../../img/contextmenu/btnColorOption.svg';
import btnColor from '../../img/contextmenu/btnColor.svg';
import injectSheet from 'react-jss';

const styles = {
  container: {
    display: 'none'
  }
};

const InlineIconsLoader = ({ classes }) => (
  <div className={classes.container}>
    <InlineSVG svg={btnColorOption} />
    <InlineSVG svg={btnColor} />
  </div>
);
export default injectSheet(styles)(InlineIconsLoader);
