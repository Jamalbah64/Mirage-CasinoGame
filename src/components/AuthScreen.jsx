import "../styles/auth.css";

export default function AuthScreen() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Mirage Casino</h1>
        <p className="auth-subtitle">
          Sign in to play Blackjack, Slots, and more.
        </p>

        <button
          className="game-button auth-google-btn"
          onClick={handleGoogleLogin}
        >
          <span className="google-icon-circle">G</span>
          <span>Continue with Google</span>
        </button>

        <p className="auth-footnote">
          Secure sign-in powered by Google OAuth.
        </p>
      </div>
    </div>
  );
}
