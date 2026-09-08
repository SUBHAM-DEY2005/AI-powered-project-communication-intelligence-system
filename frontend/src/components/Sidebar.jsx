import { NavLink, useLocation } from "react-router-dom";

const linkBase =
  "block px-4 py-2 text-sm rounded transition-colors border-l-2 border-transparent";
const linkActive = "bg-ink-light text-paper border-amber";
const linkInactive = "text-paper/70 hover:text-paper hover:bg-ink-light/60";

export default function Sidebar() {
  // Sidebar renders outside of <Routes>, so useParams() has no route match
  // context here and would always return {}. Parse the project id straight
  // from the URL instead — reliable regardless of where this is rendered.
  const { pathname } = useLocation();
  const match = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = match ? match[1] : null;

  const links = projectId
    ? [
        { to: `/projects/${projectId}`, label: "Dashboard", end: true },
        { to: `/projects/${projectId}/communication`, label: "Communication" },
        { to: `/projects/${projectId}/tasks`, label: "Tasks" },
        { to: `/projects/${projectId}/decisions`, label: "Decisions" },
        { to: `/projects/${projectId}/search`, label: "Search" },
      ]
    : [];

  return (
    <aside className="w-56 shrink-0 bg-ink min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-paper font-semibold tracking-tight text-[15px]">
          ProjectPulse <span className="text-amber">AI</span>
        </p>
        <p className="text-paper/40 text-xs mt-0.5 font-mono">
          project communication layer
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink
          to="/projects"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive && !projectId ? linkActive : linkInactive}`
          }
        >
          All Projects
        </NavLink>

        {links.length > 0 && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="px-4 pb-2 text-[11px] text-paper/40 font-mono">
              current project
            </p>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
