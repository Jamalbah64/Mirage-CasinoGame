import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import AuthScreen from "./components/AuthScreen";
import TitleScreen from "./components/TitleScreen";
import GameScreen from "./components/GameScreen";
import Header from "./components/header";
import ProfilePage from "./components/ProfilePage";

import BlackJack from "./components/games/BlackJack";
import KenoGame from "./components/games/KenoGame";
import RideTheBus from "./components/games/RideTheBus";
import SlotsGame from "./components/games/SlotsGame";

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setCheckingAuth(false);
      })
      .catch(() => {
        setUser(null);
        setCheckingAuth(false);
      });
  }, []);

  if (checkingAuth) {
    return (
      <div className="game-page">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Hide header on "/" (AuthScreen or TitleScreen, depending on user)
  const hideHeader = location.pathname === "/";

  return (
    <>
      {!hideHeader && (
      <Header
        user={user}
        onLogout={async () => {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
          setUser(null);
        }}
      />
      )}

      <div style={{ marginTop: hideHeader ? "0" : "80px" }}>
        <Routes>
          {/* ROOT: if no user → AuthScreen, if logged in → TitleScreen */}
          <Route
            path="/"
            element={user ? <TitleScreen /> : <AuthScreen />}
          />

          {/* After login: game hub + profile */}
          <Route
            path="/games"
            element={user ? <GameScreen /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={user ? <ProfilePage /> : <Navigate to="/" />}
          />

          {/* Protected individual games */}
          <Route
            path="/games/blackjack"
            element={
              user ? (
                <BlackJack
                  onCoinsChange={(newCoins) =>
                    setUser((prev) => (prev ? { ...prev, coins: newCoins } : prev))
                  } />) : (<Navigate to="/" />)}/>
          <Route
            path="/games/keno"
            element={
              user ? (
                <KenoGame
                  onCoinsChange={(newCoins) =>
                    setUser((prev) => (prev ? { ...prev, coins: newCoins } : prev))
                  }/>) : (<Navigate to="/" />)}/>
          <Route
            path="/games/ride-the-bus"
            element={
              user ? (
                <RideTheBus
                  onCoinsChange={(newCoins) =>
                    setUser((prev) => (prev ? { ...prev, coins: newCoins } : prev))
                 } /> ):(<Navigate to="/" /> )}/>
          <Route
            path="/games/slots"
            element={
              user ? (
                <SlotsGame
                  onCoinsChange={(newCoins) =>
                    setUser((prev) => (prev ? { ...prev, coins: newCoins } : prev))
                  }/>) : (<Navigate to="/" />)}/>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
