import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { HomeView } from "@/components/views/HomeView";
import { DatabaseView } from "@/components/views/DatabaseView";
import { InboxView } from "@/components/views/InboxView";
import { MeetingsView } from "@/components/views/MeetingsView";

const Index = () => {
  const [currentPage, setCurrentPage] = useState('t3'); // Default to Clientes Potenciales

  const getBreadcrumb = () => {
    switch (currentPage) {
      case 'home':
        return ['Home'];
      case 'inbox':
        return ['Inbox'];
      case 'meetings':
        return ['Meetings'];
      case 't3':
        return ['ELARIS D.S.', 'Clientes Potenciales'];
      default:
        return ['ELARIS D.S.'];
    }
  };

  const renderView = () => {
    switch (currentPage) {
      case 'home':
        return <HomeView />;
      case 'inbox':
        return <InboxView />;
      case 'meetings':
        return <MeetingsView />;
      case 't3':
        return <DatabaseView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar breadcrumb={getBreadcrumb()} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Index;
