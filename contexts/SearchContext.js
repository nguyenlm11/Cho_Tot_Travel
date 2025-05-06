import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const [currentSearch, setCurrentSearch] = useState(null);
    const [searchHistory, setSearchHistory] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userData } = useUser();

    useEffect(() => {
        const loadSearchHistory = async () => {
            try {
                if (!userData?.userID) {
                    setSearchHistory([]);
                    setLoading(false);
                    return;
                }

                const savedHistory = await AsyncStorage.getItem(`searchHistory_${userData.userID}`);
                if (savedHistory) {
                    setSearchHistory(JSON.parse(savedHistory));
                }
            } catch (err) {
                console.error('Error loading search history:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSearchHistory();
    }, [userData?.userID]);

    const updateCurrentSearch = (searchData) => {
        setCurrentSearch(searchData);
    };

    const updateSearchResults = (results) => {
        setSearchResults(results);
    };

    const addToSearchHistory = async (searchData, results) => {
        try {
            if (!userData?.userID) return;

            const existingIndex = searchHistory.findIndex(
                item =>
                    item.location === searchData.location &&
                    item.checkInDate === searchData.checkInDate &&
                    item.checkOutDate === searchData.checkOutDate &&
                    item.adults === searchData.adults &&
                    item.children === searchData.children
            );

            let newHistory = [...searchHistory];

            if (existingIndex !== -1) {
                newHistory.splice(existingIndex, 1);
            }

            const historyItem = {
                ...searchData,
                results: results || []
            };

            newHistory = [historyItem, ...newHistory].slice(0, 5);

            setSearchHistory(newHistory);
            await AsyncStorage.setItem(`searchHistory_${userData.userID}`, JSON.stringify(newHistory));
        } catch (err) {
            console.error('Error adding to search history:', err);
        }
    };

    const clearSearchHistory = async () => {
        try {
            if (!userData?.userID) return;

            setSearchHistory([]);
            await AsyncStorage.removeItem(`searchHistory_${userData.userID}`);
        } catch (err) {
            console.error('Error clearing search history:', err);
        }
    };

    const loadHistoryResults = (historyItem) => {
        setCurrentSearch(historyItem);
        setSearchResults(historyItem.results || []);
    };

    const value = {
        currentSearch,
        searchHistory,
        searchResults,
        loading,
        updateCurrentSearch,
        updateSearchResults,
        addToSearchHistory,
        clearSearchHistory,
        loadHistoryResults
    };

    return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}; 