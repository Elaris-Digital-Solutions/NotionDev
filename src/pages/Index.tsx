import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { HomeView } from "@/components/views/HomeView";
import { InboxView } from "@/components/views/InboxView";
import { MeetingsView } from "@/components/views/MeetingsView";
import { PageView } from "@/components/views/PageView";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";

interface IndexProps {
  view?: 'home' | 'inbox' | 'meetings' | 'page';
}

const Index = ({ view = 'home' }: IndexProps) => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [pageTitle, setPageTitle] = useState('');

  const currentPage = view === 'page' && pageId ? pageId : view;

  useEffect(() => {
    if (view === 'page' && pageId) {
      supabase.from('pages').select('title').eq('id', pageId).single()
        .then(({ data }) => {
          if (data) setPageTitle(data.title);
        });
    }
  }, [view, pageId]);

  const handlePageChange = (page: string) => {
    if (['home', 'inbox', 'meetings'].includes(page)) {
      navigate(page === 'home' ? '/' : `/${page}`);
    } else {
      navigate(`/page/${page}`);
    }
  };

  const getBreadcrumb = () => {
    switch (view) {
      case 'home':
        return ['Home'];
      case 'inbox':
        return ['Inbox'];
      case 'meetings':
        return ['Meetings'];
      case 'page':
        return ['ELARIS D.S.', pageTitle || 'Loading...'];
      default:
        return ['Home'];
    }
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomeView />;
      case 'inbox':
        return <InboxView />;
      case 'meetings':
        return <MeetingsView />;
      case 'page':
        return pageId ? <PageView pageId={pageId} /> : <HomeView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar breadcrumb={getBreadcrumb()} pageId={pageId} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Index;
