import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { HomeView } from "@/components/views/HomeView";
import { InboxView } from "@/components/views/InboxView";
import { MeetingsView } from "@/components/views/MeetingsView";
import { PageView } from "@/components/views/PageView";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    if (!['home', 'inbox', 'meetings'].includes(currentPage)) {
      supabase.from('pages').select('title').eq('id', currentPage).single()
        .then(({ data }) => {
          if (data) setPageTitle(data.title);
        });
    }
  }, [currentPage]);

  const getBreadcrumb = () => {
    switch (currentPage) {
      case 'home':
        return ['Home'];
      case 'inbox':
        return ['Inbox'];
      case 'meetings':
        return ['Meetings'];
      default:
        return ['ELARIS D.S.', pageTitle || 'Loading...'];
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
      default:
        return <PageView pageId={currentPage} />;
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
