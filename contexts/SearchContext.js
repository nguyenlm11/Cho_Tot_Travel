import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const [currentSearch, setCurrentSearch] = useState(null);
    const [searchHistory, setSearchHistory] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSearchHistory = async () => {
            try {
                const savedHistory = await AsyncStorage.getItem('searchHistory');
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
    }, []);

    const updateCurrentSearch = (searchData) => {
        // console.log("SearchContext - Updating currentSearch:", searchData);
        setCurrentSearch(searchData);
    };

    const updateSearchResults = (results) => {
        // console.log("SearchContext - Updating searchResults, count:", results?.length || 0);
        setSearchResults(results);
    };

    const addToSearchHistory = async (searchData) => {
        try {
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

            newHistory = [searchData, ...newHistory];

            if (newHistory.length > 5) {
                newHistory = newHistory.slice(0, 5);
            }

            setSearchHistory(newHistory);
            await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
        } catch (err) {
            console.error('Error adding to search history:', err);
        }
    };

    const clearSearchHistory = async () => {
        try {
            setSearchHistory([]);
            await AsyncStorage.removeItem('searchHistory');
        } catch (err) {
            console.error('Error clearing search history:', err);
        }
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