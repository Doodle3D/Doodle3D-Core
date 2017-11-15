import React from 'react';
import doodleSignImageURL from '../../img/doodle3d-sign.png';
import injectSheet from 'react-jss';

const styles = {
  container: {
    position: 'absolute',
    top: '0px',
    right: '15%',
    width: '19%',
    pointerEvents: 'none', // enable clicking through logo
    '& img': {
      width: '100%',
      maxWidth: '290px'
    }
  },
  '@media (max-width: 555px)': {
    container: {
      display: 'none'
    }
  }
};

const Logo = ({ classes }) => (
  <div className={classes.container}>
    <img src={doodleSignImageURL} />
  </div>
);
export default injectSheet(styles)(Logo);
