import React from 'react';
import PropTypes from 'proptypes';
import { connect } from 'react-redux';
import { isWebUri } from 'valid-url';
import PouchDB from 'pouchdb';
import { sleep } from '../utils/async.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:FileThumb');

function recursiveFetch(url, options, timeout = 1000, retries = -1) {
  return fetch(url, options).catch(async (error) => {
    if (retries === 0) throw error;
    await sleep(timeout);
    return recursiveFetch(url, options, timeout, (retries === -1) ? retries : retries - 1);
  });
}

class AuthImage extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func,
    src: PropTypes.string.isRequired,
    token: PropTypes.string,
    password: PropTypes.string
  };

  state = {
    src: null
  };

  componentWillMount() {
    const { src, token, password } = this.props;

    if (src.startsWith('/') || src.startsWith('./')) {
      this.setState({ src });
    } else if (isWebUri(src)) {
      if (token && password) {
        const filteredSrc = src.replace(/:\/\/.+?@/, '://');
        const headers = {
          Authorization: `Basic ${btoa(`${token}:${password}`)}`
        };
        recursiveFetch(filteredSrc, { headers })
          .then(response => response.blob())
          .then(blob => this.setState({ src: URL.createObjectURL(blob) }));
      } else {
        this.setState({ src });
      }
    } else {
      const [dbName, docName, attachmentName] = src.split('/');
      const db = new PouchDB(dbName);
      db.getAttachment(docName, attachmentName).then((blob) => {
        this.setState({ src: URL.createObjectURL(blob) });
      });
    }
  }

  componentWillUnmount() {
    URL.revokeObjectURL(this.state.src);
  }

  render() {
    // filter props before passing them to img element
    const props = { ...this.props };
    delete props.dispatch;
    delete props.token;
    delete props.password;
    delete props.src;
    return (<img { ...props } src={this.state.src} />);
  }
}

export default connect(state => ({
  token: state.user.session.token,
  password: state.user.session.password
}))(AuthImage);
