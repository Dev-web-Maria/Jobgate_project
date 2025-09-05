import Navbar from "./Navbar";

const Template = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow p-4 md:p-6">
        {children}
      </main>
      <footer className="bg-white py-4 border-t">
        <div className="container mx-auto text-center text-gray-500">
          © {new Date().getFullYear()} JobGate - Tous droits réservés
        </div>
      </footer>
    </div>
  );
};

export default Template;