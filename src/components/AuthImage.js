import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { isWebUri } from 'valid-url';
import PouchDB from 'pouchdb';
// import createDebug from 'debug';
// const debug = createDebug('d3d:FileThumb');

class AuthImage extends React.Component {
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
        fetch(filteredSrc, { headers })
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
AuthImage.propTypes = {
  dispatch: PropTypes.func,
  src: PropTypes.string.isRequired,
  token: PropTypes.string,
  password: PropTypes.string
};
AuthImage.state = {
  src: null
};


export default connect(state => ({
  token: state.user.session.token,
  password: state.user.session.password
}))(AuthImage);
