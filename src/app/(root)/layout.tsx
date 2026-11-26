import Footer from '@/components/shared/footer';
import NavbarPage from '@/components/shared/Navbar';
import React from 'react';

const HomePageLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <NavbarPage />
            {children}
            <Footer></Footer>
        </div>
    );
};

export default HomePageLayout;