import ReactDOM from 'react-dom';

export function Portal({ children }) {
    return ReactDOM.createPortal(children, document.body);
}
