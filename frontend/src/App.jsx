import React from "react";
import { Link } from "react-router-dom";

const TaskboardIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14">
    <rect x="8" y="8" width="48" height="48" rx="8" fill="url(#taskGradient)" />
    <rect x="16" y="18" width="16" height="3" rx="1.5" fill="white" opacity="0.9" />
    <rect x="16" y="26" width="24" height="3" rx="1.5" fill="white" opacity="0.9" />
    <rect x="16" y="34" width="20" height="3" rx="1.5" fill="white" opacity="0.9" />
    <rect x="16" y="42" width="18" height="3" rx="1.5" fill="white" opacity="0.7" />
    <circle cx="44" cy="20" r="6" fill="#10b981" />
    <path d="M42 20L43.5 21.5L46 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="taskGradient" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0d9488" />
        <stop offset="1" stopColor="#14b8a6" />
      </linearGradient>
    </defs>
  </svg>
);

const cards = [
  {
    title: "Event Management",
    description: "Create, manage, and track all your events in one place.",
    image: "/event-management.png",
    button: "Explore Events",
    link: "/events",
    useImage: true,
  },
  {
    title: "Taskboard",
    description: "Assign, monitor, and complete tasks with your team.",
    button: "View Tasks",
    link: "/taskboard",
    useImage: false,
  },
  {
    title: "Drive Archive",
    description: "Access and manage all your event files and resources.",
    image: "/google-drive.png",
    button: "Open Archive",
    link: "/archive",
    useImage: true,
  },
];

export default function App() {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-900 to-slate-950"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="mb-16 opacity-0 animate-fade-in">
          <h2 
            className="text-6xl md:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-teal-300 via-teal-400 to-amber-400"
            style={{fontFamily: "'Playfair Display', serif"}}
          >
            EventSphere
          </h2>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 w-32 bg-gradient-to-r from-teal-500 to-amber-500 rounded-full" />
            <div className="h-1 w-12 bg-amber-500/50 rounded-full" />
          </div>
          <p className="text-xl text-slate-300 mb-4 max-w-3xl leading-relaxed">
            A modern platform to manage events, assign tasks, and share resources with your team. 
            <span className="text-teal-400 font-semibold"> Built for productivity and collaboration.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={card.title}
              className="opacity-0 animate-slide-in-up"
              style={{animationDelay: `${index * 0.15}s`}}
            >
              <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/10">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-amber-500/0 group-hover:from-teal-500/10 group-hover:to-amber-500/5 transition-all duration-500"></div>
                
                <div className="relative p-8 flex flex-col h-full">
                  {/* Image with geometric frame */}
                  <div className="relative mb-6 w-fit">
                    <div className="absolute -inset-1 bg-gradient-to-br from-teal-500 to-amber-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative bg-slate-950 p-3 rounded-xl flex items-center justify-center">
                      {card.useImage ? (
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <TaskboardIcon />
                      )}
                    </div>
                  </div>

                  <h3 
                    className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-teal-300 transition-colors duration-300"
                    style={{fontFamily: "'Playfair Display', serif"}}
                  >
                    {card.title}
                  </h3>
                  <p className="mb-8 text-base text-slate-400 leading-relaxed flex-grow">
                    {card.description}
                  </p>

                  <Link
                    to={card.link}
                    className="relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-base overflow-hidden group/btn bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-teal-500 to-amber-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center gap-2">
                      {card.button}
                      <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="mt-20 flex justify-center gap-2 opacity-30">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
        </div>
      </section>
    </div>
  );
}
