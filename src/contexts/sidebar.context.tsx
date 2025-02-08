import React, { createContext, useState, useContext } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpenState, setIsOpenState] = useState<boolean>(false);

  const contextValue = {
    isOpen: isOpenState,
    setIsOpen: setIsOpenState
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
