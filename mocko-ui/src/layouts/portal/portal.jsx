import ReactDOM from 'react-dom';

export function Portal({ children, isPageChildren }) {
    let target = document.body;
    if (isPageChildren) {
        target = document.getElementById('page');
    }

    return ReactDOM.createPortal(children, target);
}
