import React, {useContext, useState} from 'react';
import * as qs from 'qs';
import {List} from "../../components/list/list";
import {MockItem} from "../mock-item/mock-item";
import {Spinner} from "../../components/spinner/spinner";
import {Mocks} from "../../contexts/mock";
import {Link, useHistory, useLocation} from "react-router-dom";
import { SearchIcon, SearchInput, SearchCloseIcon } from "./styles";
import { NoMocks } from "./no-mocks";
import { Title, TitleButton, TitleText } from '../../components/title/styles';

export function MockList() {
    const location = useLocation();
    const query = qs.parse(location.search, { ignoreQueryPrefix: true }).q || '';

    const { mocks, isLoading, hasError, removeMock } = useContext(Mocks);
    const [filter, setFilter] = useState(query);

    if(isLoading) {
        return <Spinner/>;
    }

    if(hasError) {
        return "Oops! Failed to load mocks";
    }

    if(mocks.length === 0) {
        return <NoMocks/>;
    }

    const filteredMocks = mocks.filter(m => matchMock(m, filter));

    return (
        <>
        <MockListTitle onChange={ setFilter } initialQuery={query} />
        <List>
            {filteredMocks.map(mock =>
                <MockItem {...mock} key={mock.id} onRemove={() => removeMock(mock.id)}/>)}
        </List>
        </>
    );
}

function matchMock(mock, filter) {
    const keywords = filter
        .trim()
        .split(' ')
        .filter(k => k.length > 0)
        .map(k => k.toLowerCase());

    if(keywords.length === 0) {
        return true;
    }

    const doc = ((mock.name || '') + (mock.path || '')).toLowerCase();

    return keywords.some(k => doc.includes(k));
}

function MockListTitle({ onChange, initialQuery }) {
    const history = useHistory();
    const [query, setQuery] = useState(initialQuery);
    const [isSearching, setSearching] = useState(!!query);

    const changeQuery = event => {
        const value = event.target.value;
        setQuery(value);
        onChange(value);
        history.push(`/mocks?q=${value}`);
    };
    const closeSearch = () => {
        setQuery('');
        onChange('');
        setSearching(false);
        history.push('/mocks');
    };

    return (
        <Title>
            {isSearching ?
                <TitleText>
                    <SearchInput autoFocus value={query} onChange={ changeQuery }></SearchInput>
                    <SearchCloseIcon onClick={ closeSearch }>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white"/>
                        </svg>
                    </SearchCloseIcon>
                </TitleText>
            :
                <TitleText>
                    Mocks
                    <SearchIcon onClick={ () => setSearching(true) }>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path fill="#FFF" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                    </SearchIcon>
                </TitleText>
            }
            <Link to="/mocks/new">
                <TitleButton>New Mock</TitleButton>
            </Link>
        </Title>
    );
}
