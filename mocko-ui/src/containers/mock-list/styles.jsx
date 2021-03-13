import styled from 'styled-components';
import { IconView } from '../../components/icon/styles';
import { Input } from '../../components/input/styles';

export const SearchInput = styled(Input)`
  width: 16rem;
  margin-left: -0.75rem;
`;

export const SearchIcon = styled(IconView)`
  position: static;
  opacity: 0.7;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const SearchCloseIcon = styled(IconView)`
  width: 2rem;
  height: 2rem;
  right: 0.75rem;
  top: 0.25rem;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const NoMocksView = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 1.25rem;
  font-family: Roboto, Arial, sans-serif;
  * {
    margin-bottom: 1.5rem;
  }
  
  button {
    margin-top: 0.5rem;
  }
`;
