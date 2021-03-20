import React from 'react';
import styled from 'styled-components';
import { FLAG_ICON, FOLDER_ICON } from './flag-folder';

export const FolderSkeletonView = styled.div`
    height: 100%;
`;

const FilesSkeleton = styled.ul`
    display: inline-block;
    vertical-align: top;
    height: 100%;
    width: 16rem;
    padding: 1rem;
`;

const FileSkeletonView = styled.li`
    position: relative;
    display: block;
    height: 2.25rem;
    padding-left: 2.5rem;
    padding-right: 0.5rem;
    border-bottom: 1px solid #1E1E1E;

    &:last-child {
        border-bottom: none;
    }

    svg {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        width: 1.25rem;
        height: 1.25rem;
        opacity: 0.4;
    }
`;

const TextSkeleton = styled.span`
    display: inline-block;
    background-color: rgba(255, 255, 255, 0.3);
    height: 0.75rem;
    width: 8rem;
    margin-top: 0.75rem;
    border-radius: var(--radius);
`;

function FileSkeleton({ isFolder }) {
    return (
        <FileSkeletonView>
            {isFolder ? FOLDER_ICON : FLAG_ICON}
            <TextSkeleton/>
        </FileSkeletonView>
    );
}

export function FolderSkeleton() {
    return (
        <FolderSkeletonView>
            <FilesSkeleton>
                <FileSkeleton isFolder />
                <FileSkeleton isFolder />
                <FileSkeleton isFolder />
                <FileSkeleton />
            </FilesSkeleton>
        </FolderSkeletonView>
    );
}
