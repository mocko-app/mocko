import React, {useEffect, useState} from 'react';
import { Folder } from '../../components/folder/folder';
import { File } from '../../components/folder/file';
import { client } from '../../utils';
import { Button } from '../../components/button/button';
import { NoContent } from "../../components/no-content/no-content";
import {FlagCrud} from "../../components/flag-crud/flag-crud";
import { FolderSkeleton } from './skeleton';

export const FOLDER_ICON = (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="white"/>
    </svg>
);

export const FLAG_ICON = (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z" fill="white" />
    </svg>
);

export function FlagFolder({ prefix }) {
    const [flags, setFlags] = useState(null);

    useEffect(() => {
        setFlags(null);
        client.get('/flags?prefix=' + prefix).then(({ data }) => setFlags(data));
    }, [prefix]);

    if(flags === null) {
        return <FolderSkeleton/>;
    }

    if(flags.length === 0 && prefix === "") {
        return (
            <NoContent>
                No flags found
                <br/>

                {/* eslint-disable-next-line */}
                <a href="https://mocko.dev/templating/persistence/" target="_blank">
                    <Button>Go to Docs</Button>
                </a>
            </NoContent>
        );
    }

    return (
        <Folder>
            {flags.map(f =>
                <File
                    key={f.type + prefix + f.name}
                    id={prefix + f.name}
                    name={f.name}
                    icon={f.type === "PREFIX" ? FOLDER_ICON : FLAG_ICON}
                    contentProducer={() => f.type === "PREFIX" ?
                        <FlagFolder prefix={prefix + f.name + ":"}/>
                        : <FlagCrud flag={prefix + f.name}/>}
                    />)}
        </Folder>
    );
}
