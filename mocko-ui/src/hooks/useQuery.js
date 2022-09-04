import { useLocation } from "react-router-dom";
import * as qs from 'qs';

export function useQuery(key) {
    const location = useLocation();
    const query = qs.parse(location.search, { ignoreQueryPrefix: true });

    if(key) {
        return query[key] || '';
    }

    return query;
}