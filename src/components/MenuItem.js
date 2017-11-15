import React from 'react';
import Button from './Button.js';
import injectSheet from 'react-jss';

const styles = {
  container: {
    display: 'block'
  }
};

const MenuItem = ({ id, value, selected, disabled, onSelect, children, className, svg, classes }) => {
  return (
    <li className={`${classes.container} menuitem`}>
      <Button
        className={className}
        id={id}
        value={value}
        selected={selected}
        disabled={disabled}
        onSelect={onSelect}
        svg={svg}
      >
        {children}
      </Button>
    </li>
  );
};
export default injectSheet(styles)(MenuItem);
