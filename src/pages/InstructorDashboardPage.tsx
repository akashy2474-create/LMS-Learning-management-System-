import React, { useState } from 'react';
import { Sidebar } from '../components/ui/Sidebar';
import { TopBar } from '../components/ui/TopBar';
import { InstructorCoursesTab } from '../components/instructor/InstructorCoursesTab';
import { InstructorStudentsTab } from '../components/instructor/InstructorStudentsTab';
import { InstructorMessagesTab } from '../components/instructor/InstructorMessagesTab';
import { Footer } from '../components/ui/Footer';

export const InstructorDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-courses');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar: Fixed on desktop, slide-over drawer on mobile */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area: Offset by sidebar on desktop (lg:pl-64) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <TopBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          isMobileMenuOpen={mobileOpen}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'my-courses' && <InstructorCoursesTab />}
          {activeTab === 'students' && <InstructorStudentsTab />}
          {activeTab === 'messages' && <InstructorMessagesTab />}
        </main>

        <Footer />
      </div>
    </div>
  );
};
