import React, { useState } from 'react';
import { Sidebar } from '../components/ui/Sidebar';
import { TopBar } from '../components/ui/TopBar';
import { StudentMyCoursesTab } from '../components/student/StudentMyCoursesTab';
import { StudentBrowseCoursesTab } from '../components/student/StudentBrowseCoursesTab';
import { StudentProgressTab } from '../components/student/StudentProgressTab';
import { StudentMessagesTab } from '../components/student/StudentMessagesTab';
import { Footer } from '../components/ui/Footer';

export const StudentDashboardPage: React.FC = () => {
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
          {activeTab === 'my-courses' && <StudentMyCoursesTab onBrowseCatalog={() => setActiveTab('browse')} />}
          {activeTab === 'browse' && <StudentBrowseCoursesTab />}
          {activeTab === 'progress' && <StudentProgressTab />}
          {activeTab === 'messages' && <StudentMessagesTab />}
        </main>

        <Footer />
      </div>
    </div>
  );
};
