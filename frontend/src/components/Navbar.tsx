import React from "react";
import { User } from "../types";
import { BookOpen, LogIn, LogOut, PlusCircle, UserCheck } from "lucide-react";

interface NavbarProps {
  user: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
  onOpenAddRepo: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenAddRepo,
  onGoHome,
}) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={onGoHome}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BookOpen size={24} color="#3b82f6" />
            <span>RepoMind</span>
          </div>
          <span className="brand-badge">Evaluation 1</span>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={onOpenAddRepo}
              >
                <PlusCircle size={16} />
                <span>Add Repository</span>
              </button>

              <div className="user-badge">
                <UserCheck size={14} color="#10b981" />
                <span>{user.username || user.email}</span>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                title="Log out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAuth("login")}
              >
                <LogIn size={15} />
                <span>Log In</span>
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenAuth("register")}
              >
                <span>Register</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
