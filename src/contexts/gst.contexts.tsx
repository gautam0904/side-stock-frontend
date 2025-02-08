import React, { createContext, useState, useContext } from 'react';

interface GstContextType {
  isNonGST: boolean;
  setIsNonGST: (value: boolean) => void;
}

export const GstContext = createContext<GstContextType>({
  isNonGST: false,
  setIsNonGST: () => {},
});

export const GstProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNonGSTState, setIsNonGSTState] = useState<boolean>(false);

  const contextValue = {
    isNonGST: isNonGSTState,
    setIsNonGST: setIsNonGSTState
  };

  return (
    <GstContext.Provider value={contextValue}>
      {children}
    </GstContext.Provider>
  );
};

export const useGst = () => useContext(GstContext);
