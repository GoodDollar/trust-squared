import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAccount } from "wagmi";
import "./App.css";
import BottomNavbar from "./components/BottomNavbar";
// import Navbar from "./components/Navbar";
import Trustees from "./screens/Trustees";
import Home from "./screens/Home";
import Layout from "./screens/Layout";
import Login from "./screens/Login";
import Dashborad from "./screens/Dashborad";
import { QrScan } from "./screens/TrustAction";

function App() {
  const { isConnected } = useAccount();

  return (
    <BrowserRouter>
      {!isConnected ? (
        <Login />
      ) : (
        <Routes>
          {/* Other routes with navbars */}
          <Route
            path="/*"
            element={
              <>
                {/* <Navbar /> */}
                <Routes>
                  {/* Add your other routes here */}
                  <Route
                    path="/"
                    element={
                      <Layout>
                        <Home />
                      </Layout>
                    }
                  />
                  <Route
                    path="/trustees"
                    element={
                      <Layout>
                        <Trustees />
                      </Layout>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <Layout>
                    <Dashborad />
                      </Layout>
                    }
                  />
                  {/* <Route
                    path="/history"
                    element={
                      <Layout>
                        <History />
                      </Layout>
                    }
                  /> */}
                  <Route
                    path="/trust"
                    element={
                      <Layout>
                        <QrScan />
                      </Layout>
                    }
                  />
                </Routes>
                <BottomNavbar />
              </>
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
