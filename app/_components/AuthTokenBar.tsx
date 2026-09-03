"use client";

type AuthTokenBarProps = {
  token: string;
  onChange: (value: string) => void;
};

export default function AuthTokenBar({ token, onChange }: AuthTokenBarProps) {
  return (
    <section className="token-bar animate-rise" style={{ animationDelay: "0.05s" }}>
      <div className="panel-header">
        <h2 className="panel-title font-display">Authentication Token</h2>
        <p className="panel-desc">
          Paste a JWT access token to enable secured requests.
        </p>
      </div>
      <div className="token-bar__controls">
        <input
          className="input token-input"
          type="password"
          value={token}
          onChange={(event) => onChange(event.target.value)}
          placeholder="JWT access token"
        />
        <button
          className="btn-ghost"
          type="button"
          onClick={() => onChange("")}
        >
          Clear
        </button>
      </div>
      <p className="helper-text">
        Stored locally in this browser. Role access is enforced by the API.
      </p>
    </section>
  );
}
