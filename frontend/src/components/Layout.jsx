import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-main">
          <div className="layout-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
