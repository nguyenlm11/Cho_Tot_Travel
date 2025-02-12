import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const [searchHistory, setSearchHistory] = useState([]);
    const [currentSearch, setCurrentSearch] = useState({
        location: '',
        checkInDate: '',
        checkOutDate: '', 
        numberOfNights: 1,
        rooms: 1,
        adults: 1,
        children: 0,
        priceFrom: '',
        priceTo: '',
        selectedStar: null,
        latitude: '',
        longitude: '',
    });

    const addToSearchHistory = (searchData) => {
        setSearchHistory(prevHistory => {
            // Giới hạn lịch sử tìm kiếm đến 5 items
            const newHistory = [searchData, ...prevHistory.slice(0, 4)];
            // Lọc bỏ các tìm kiếm trùng lặp
            return newHistory.filter((item, index, self) =>
                index === self.findIndex((t) => t.location === item.location)
            );
        });
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
    };

    const updateCurrentSearch = (newSearchData) => {
        setCurrentSearch(prev => ({
            ...prev,
            ...newSearchData
        }));
    };

    return (
        <SearchContext.Provider value={{
            searchHistory,
            currentSearch,
            addToSearchHistory,
            clearSearchHistory,
            updateCurrentSearch,
        }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}; 