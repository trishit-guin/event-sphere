import React from "react";
import { Link } from "react-router-dom";

const cards = [
  {
    title: "Event Management",
    description: "Create, manage, and track all your events in one place.",
    image: "/event-management.png",
    button: "Explore Events",
    link: "/events",
  },
  {
    title: "Taskboard",
    description: "Assign, monitor, and complete tasks with your team.",
    image: "/taskboard.png",
    button: "View Tasks",
    link: "/taskboard",
  },
  {
    title: "Drive Archive",
    description: "Access and manage all your event files and resources.",
    image: "/google-drive.png",
    button: "Open Archive",
    link: "/archive",
  },
];

export default function App() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 to-white overflow-hidden scrollbar-hide">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome to EventSphere</h2>
        <div className="h-1 w-24 bg-purple-600 rounded-full mb-12" />
        <p className="text-lg text-gray-600 mb-12 max-w-2xl">A modern platform to manage events, assign tasks, and share resources with your team. Built for productivity and collaboration.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {cards.map((card) => (
            <div
              key={card.title}
              className="relative rounded-3xl shadow-xl p-8 flex flex-col items-start bg-white transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl border border-gray-100"
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-20 h-20 rounded-xl object-cover mb-6 shadow-md border-4 border-white"
              />
              <h3 className="text-2xl font-bold mb-2 text-gray-900">{card.title}</h3>
              <p className="mb-6 text-base text-gray-600">{card.description}</p>
              <Link
                to={card.link}
                className="mt-auto px-7 py-2.5 rounded-full font-bold transition text-lg shadow-sm bg-purple-600 text-white hover:bg-purple-700"
              >
                {card.button}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
