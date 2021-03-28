import React, {useState} from 'react';
import styled from 'styled-components';
import { FolderFile } from './file';

const FolderView = styled.section`
    height: 100%;
    white-space: nowrap;
`;

const FolderContent = styled.div`
    display: inline-block;
    height: 100%;
    vertical-align: top;
    border-left: 1px solid #474747;
`;

const Files = styled.ul`
    display: inline-block;
    vertical-align: top;
    height: calc(100% - 2rem);
    min-width: 16rem;
    max-width: 32rem;
    padding: 0 1rem;
    margin: 1rem 0;
    overflow-x: hidden;
    overflow-y: auto;
`;

export function Folder({ children }) {
    const [ activeFileId, setActiveFileId ] = useState(null);
    let content = null;

    const files = React.Children.map(children, file => {
        let isActive = activeFileId === file.props.id;
        if(isActive) {
            content = file.props.contentProducer();
        }

        return <FolderFile
            name={ file.props.name }
            icon={ file.props.icon }
            key={ file.props.id }
            onClick={ () => setActiveFileId(file.props.id) }
            isActive={ isActive } />
    });

    return (
        <FolderView>
            <Files>
                { files }
            </Files>
            { content && <FolderContent>{ content }</FolderContent>}
        </FolderView>
    );
}
