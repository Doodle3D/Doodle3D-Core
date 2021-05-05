import React from 'react';
import doodleSignImageURL from '../../img/doodle3d-sign.png';
import injectSheet from 'react-jss';

const styles = {
  container: {
    position: 'absolute',
    top: '0px',
    right: '15%',
    width: '19%',
    backgroundImage: `url("${doodleSignImageURL}")`,
    maxWidth: '290px',
    height: '140px',
    backgroundSize: '100%',
    backgroundRepeat: 'no-repeat',
    pointerEvents: 'none', // enable clicking through logo
  },
  '@media (max-width: 555px)': {
    container: {
      display: 'none'
    }
  }
};

const Logo = ({ classes }) => (
  <div className={classes.container} />
);
export default injectSheet(styles)(Logo);
