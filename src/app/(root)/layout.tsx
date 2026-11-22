import NavbarPage from '@/components/shared/Navbar';
import React from 'react';

const HomePageLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <NavbarPage />
            {children}
        </div>
    );
};

export default HomePageLayout;