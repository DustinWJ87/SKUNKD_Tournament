"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface Event {
  id: string;
  title: string;
  game: string;
  description: string;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: string;
  seatMapId: string;
  seatMap: {
    id: string;
    name: string;
  };
  _count: {
    registrations: number;
    teams: number;
  };
}

interface SeatMap {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
}

export default function AdminEventDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    description: "",
    maxParticipants: "",
    entryFee: "",
    prizePool: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    seatMapId: "",
    status: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
      router.push("/auth/signin");
      return;
    }

    fetchEvent();
    fetchSeatMaps();
  }, [session, status, router, params.id]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`);
      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
        setFormData({
          title: eventData.title,
          game: eventData.game,
          description: eventData.description || "",
          maxParticipants: eventData.maxParticipants.toString(),
          entryFee: eventData.entryFee.toString(),
          prizePool: eventData.prizePool.toString(),
          startDate: new Date(eventData.startDate).toISOString().slice(0, 16),
          endDate: new Date(eventData.endDate).toISOString().slice(0, 16),
          registrationDeadline: new Date(eventData.registrationDeadline).toISOString().slice(0, 16),
          seatMapId: eventData.seatMapId,
          status: eventData.status,
        });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatMaps = async () => {
    try {
      const response = await fetch("/api/seat-maps");
      if (response.ok) {
        const data = await response.json();
        setSeatMaps(data);
      }
    } catch (error) {
      console.error("Error fetching seat maps:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: parseInt(formData.maxParticipants),
          entryFee: parseFloat(formData.entryFee),
          prizePool: parseFloat(formData.prizePool),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        fetchEvent();
      } else {
        const error = await response.json();
        alert(`Error updating event: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Error updating event");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user?.role !== "SUPERADMIN" && session.user?.role !== "EVENT_ORGANIZER")) {
    return null;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {isEditing ? "Edit Event" : event.title}
            </h1>
            <p className="text-purple-200">
              {isEditing ? "Update event details" : `${event.game} Tournament`}
            </p>
          </div>
          <div className="flex gap-4">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  Edit Event
                </button>
                <button
                  onClick={() => router.push("/admin/events")}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Back to Events
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    fetchEvent(); // Reset form data
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20 p-8">
          {!isEditing ? (
            // View Mode
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-purple-200 mb-2">Event Details</h3>
                  <div className="space-y-2 text-white">
                    <p><span className="text-purple-300">Game:</span> {event.game}</p>
                    <p><span className="text-purple-300">Max Participants:</span> {event.maxParticipants}</p>
                    <p><span className="text-purple-300">Entry Fee:</span> ${event.entryFee}</p>
                    <p><span className="text-purple-300">Prize Pool:</span> ${event.prizePool}</p>
                    <p><span className="text-purple-300">Status:</span> {event.status}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-purple-200 mb-2">Schedule</h3>
                  <div className="space-y-2 text-white">
                    <p><span className="text-purple-300">Start:</span> {new Date(event.startDate).toLocaleString()}</p>
                    <p><span className="text-purple-300">End:</span> {new Date(event.endDate).toLocaleString()}</p>
                    <p><span className="text-purple-300">Registration Deadline:</span> {new Date(event.registrationDeadline).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-purple-200 mb-2">Venue</h3>
                  <div className="space-y-2 text-white">
                    <p><span className="text-purple-300">Seat Map:</span> {event.seatMap.name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-purple-200 mb-2">Statistics</h3>
                  <div className="space-y-2 text-white">
                    <p><span className="text-purple-300">Registrations:</span> {event._count.registrations}</p>
                    <p><span className="text-purple-300">Teams:</span> {event._count.teams}</p>
                  </div>
                </div>
              </div>

              {event.description && (
                <div>
                  <h3 className="text-lg font-semibold text-purple-200 mb-2">Description</h3>
                  <p className="text-white">{event.description}</p>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-purple-200 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="game" className="block text-sm font-medium text-purple-200 mb-2">
                    Game *
                  </label>
                  <input
                    type="text"
                    id="game"
                    name="game"
                    required
                    value={formData.game}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-purple-200 mb-2">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    required
                    min="1"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="entryFee" className="block text-sm font-medium text-purple-200 mb-2">
                    Entry Fee ($)
                  </label>
                  <input
                    type="number"
                    id="entryFee"
                    name="entryFee"
                    min="0"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="prizePool" className="block text-sm font-medium text-purple-200 mb-2">
                    Prize Pool ($)
                  </label>
                  <input
                    type="number"
                    id="prizePool"
                    name="prizePool"
                    min="0"
                    step="0.01"
                    value={formData.prizePool}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="seatMapId" className="block text-sm font-medium text-purple-200 mb-2">
                    Seat Map *
                  </label>
                  <select
                    id="seatMapId"
                    name="seatMapId"
                    required
                    value={formData.seatMapId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  >
                    <option value="">Select a seat map</option>
                    {seatMaps.map((seatMap) => (
                      <option key={seatMap.id} value={seatMap.id}>
                        {seatMap.name} ({seatMap.width}×{seatMap.height})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-purple-200 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-purple-200 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="registrationDeadline" className="block text-sm font-medium text-purple-200 mb-2">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    id="registrationDeadline"
                    name="registrationDeadline"
                    required
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-purple-200 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="REGISTRATION_OPEN">Registration Open</option>
                    <option value="REGISTRATION_CLOSED">Registration Closed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-purple-200 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  placeholder="Describe your tournament event..."
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}