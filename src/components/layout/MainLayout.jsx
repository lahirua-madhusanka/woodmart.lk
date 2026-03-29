import { Outlet } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";
import Footer from "./Footer";
import Navbar from "./Navbar";

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;