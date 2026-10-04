"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string | null;
};

type Friendship = {
  id: number;
  user_id: string;
  friend_id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  created_at: string | null;
  profile?: Profile | null;
};

type Stats = {
  total: number;
  read: number;
  reading: number;
  toRead: number;
  abandoned: number;
  series: number;
  tomes: number;
  averageRating: number;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    read: 0,
    reading: 0,
    toRead: 0,
    abandoned: 0,
    series: 0,
    tomes: 0,
    averageRating: 0,
  });

  const [newUsername, setNewUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Social
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loadingFriendships, setLoadingFriendships] = useState(false);

  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);
      setError("Impossible de charger le profil.");
      return;
    }

    setProfile(profileData);
    setNewUsername(profileData.username);

    await loadStats(user.id);
    await loadFriendships(user.id);
  }

  async function loadStats(userId: string) {
    const { data, error } = await supabase
      .from("user_books")
      .select(`
        status,
        rating,
        books (
          id,
          series,
          series_number
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    const books = data ?? [];

    const total = books.length;

    const read = books.filter((book) => book.status === "READ").length;

    const reading = books.filter(
      (book) => book.status === "READING"
    ).length;

    const toRead = books.filter(
      (book) => book.status === "TO_READ"
    ).length;

    const abandoned = books.filter(
      (book) => book.status === "ABANDONED"
    ).length;

    const seriesNames = new Set<string>();

    books.forEach((book) => {
      const bookData = Array.isArray(book.books)
        ? book.books[0]
        : book.books;

      if (bookData?.series) {
        seriesNames.add(bookData.series.trim().toLowerCase());
      }
    });

    const tomes = books.filter((book) => {
      const bookData = Array.isArray(book.books)
        ? book.books[0]
        : book.books;

      return bookData?.series_number != null;
    }).length;

    const ratings = books
      .map((book) => book.rating)
      .filter((rating): rating is number => rating != null);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) /
          ratings.length
        : 0;

    setStats({
      total,
      read,
      reading,
      toRead,
      abandoned,
      series: seriesNames.size,
      tomes,
      averageRating,
    });
  }

  async function loadFriendships(userId: string) {
    setLoadingFriendships(true);

    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoadingFriendships(false);
      return;
    }

    const friendshipRows = data ?? [];

    const otherUserIds = friendshipRows.map((friendship) =>
      friendship.user_id === userId
        ? friendship.friend_id
        : friendship.user_id
    );

    let profilesMap = new Map<string, Profile>();

    if (otherUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, created_at")
        .in("id", otherUserIds);

      if (profilesError) {
        console.error(profilesError);
      } else {
        profilesMap = new Map(
          (profilesData ?? []).map((item) => [item.id, item])
        );
      }
    }

    const enrichedFriendships: Friendship[] = friendshipRows.map(
      (friendship) => {
        const otherUserId =
          friendship.user_id === userId
            ? friendship.friend_id
            : friendship.user_id;

        return {
          ...friendship,
          profile: profilesMap.get(otherUserId) ?? null,
        };
      }
    );

    setFriendships(enrichedFriendships);
    setLoadingFriendships(false);
  }

  async function handleSearchUsers() {
    const query = searchUsername.trim();

    setMessage("");
    setError("");

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id;

    if (!currentUserId) {
      setSearching(false);
      return;
    }

    const { data, error: searchError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, created_at")
      .ilike("username", `%${query}%`)
      .neq("id", currentUserId)
      .limit(10);

    if (searchError) {
      console.error(searchError);
      setError("Impossible de rechercher les utilisateurs.");
      setSearchResults([]);
    } else {
      setSearchResults(data ?? []);
    }

    setSearching(false);
  }

  function getRelationshipStatus(userId: string) {
    const friendship = friendships.find(
      (item) =>
        (item.user_id === profile?.id && item.friend_id === userId) ||
        (item.friend_id === profile?.id && item.user_id === userId)
    );

    return friendship?.status ?? null;
  }

  async function sendFriendRequest(friendId: string) {
    if (!profile) return;

    setSendingRequest(friendId);
    setMessage("");
    setError("");

    const existingStatus = getRelationshipStatus(friendId);

    if (existingStatus === "PENDING") {
      setMessage("Une demande est déjà en attente.");
      setSendingRequest(null);
      return;
    }

    if (existingStatus === "ACCEPTED") {
      setMessage("Vous êtes déjà amis.");
      setSendingRequest(null);
      return;
    }

    const { error: insertError } = await supabase
      .from("friendships")
      .insert({
        user_id: profile.id,
        friend_id: friendId,
        status: "PENDING",
      });

    if (insertError) {
      console.error(insertError);

      if (insertError.code === "23505") {
        setMessage("Une demande existe déjà pour cet utilisateur.");
      } else {
        setError("Impossible d'envoyer la demande.");
      }

      setSendingRequest(null);
      return;
    }

    setMessage("Demande d'ami envoyée.");

    await loadFriendships(profile.id);

    setSendingRequest(null);
  }

  async function handleFriendRequest(
    friendshipId: number,
    status: "ACCEPTED" | "DECLINED"
  ) {
    if (!profile) return;

    setProcessingRequest(friendshipId);
    setMessage("");
    setError("");

    const { error: updateError } = await supabase
      .from("friendships")
      .update({ status })
      .eq("id", friendshipId)
      .eq("friend_id", profile.id)
      .eq("status", "PENDING");

    if (updateError) {
      console.error(updateError);
      setError("Impossible de mettre à jour la demande.");
      setProcessingRequest(null);
      return;
    }

    setMessage(
      status === "ACCEPTED"
        ? "Demande acceptée."
        : "Demande refusée."
    );

    await loadFriendships(profile.id);

    setProcessingRequest(null);
  }

  async function saveUsername() {
    if (!profile) return;

    const username = newUsername.trim();

    if (!username) {
      setError("Le pseudo ne peut pas être vide.");
      return;
    }

    if (username.length < 2) {
      setError("Le pseudo doit contenir au moins 2 caractères.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({
        username,
      })
      .eq("id", profile.id)
      .select("id, username, avatar_url, created_at")
      .single();

    if (updateError) {
      console.error(updateError);

      if (updateError.code === "23505") {
        setError("Ce pseudo est déjà utilisé.");
      } else {
        setError("Impossible de modifier le pseudo.");
      }

      setSaving(false);
      return;
    }

    setProfile(data);

    await supabase.auth.updateUser({
      data: {
        username: data.username,
      },
    });

    setNewUsername(data.username);
    setIsEditing(false);
    setMessage("Profil mis à jour.");

    setSaving(false);
  }

  function cancelEdit() {
    if (profile) {
      setNewUsername(profile.username);
    }

    setIsEditing(false);
    setError("");
    setMessage("");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const receivedRequests = friendships.filter(
    (friendship) =>
      friendship.friend_id === profile?.id &&
      friendship.status === "PENDING"
  );

  const sentRequests = friendships.filter(
    (friendship) =>
      friendship.user_id === profile?.id &&
      friendship.status === "PENDING"
  );

  const acceptedFriends = friendships.filter(
    (friendship) => friendship.status === "ACCEPTED"
  );

  return (
    <main className="min-h-screen bg-[#FFF9F2] px-4 py-8 text-[#31095A]">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-[#31095A]/70 hover:text-[#31095A]"
            >
              ← Retour à l'accueil
            </Link>

            <h1 className="mt-3 text-3xl font-black">
              Mon profil
            </h1>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-[#31095A]/15 bg-white px-4 py-2 text-sm font-semibold hover:bg-[#31095A]/5"
          >
            Déconnexion
          </button>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* PROFIL */}
        {profile && (
          <section className="rounded-[20px] border border-[#31095A]/10 bg-white p-5 shadow-[0_4px_20px_rgba(49,9,90,0.05)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f837e2] text-4xl font-black text-[#31095A]">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newUsername}
                      onChange={(event) =>
                        setNewUsername(event.target.value)
                      }
                      className="rounded-xl border border-[#31095A]/15 px-4 py-3 outline-none focus:border-[#31095A]"
                      placeholder="Nouveau pseudo"
                    />

                    <button
                      onClick={saveUsername}
                      disabled={saving}
                      className="rounded-xl bg-[#31095A] px-5 py-3 font-bold text-[#31095A] disabled:opacity-50"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>

                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="rounded-xl border border-[#31095A]/15 px-5 py-3 font-semibold"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-black">
                      {profile.username}
                    </h2>

                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setMessage("");
                        setError("");
                      }}
                      className="rounded-lg border border-[#31095A]/15 px-3 py-1.5 text-sm font-semibold hover:bg-[#31095A]/5"
                    >
                      Modifier
                    </button>
                  </div>
                )}

                <p className="mt-2 text-sm text-[#31095A]/60">
                  Ton profil Biblidex
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STATS */}
        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Livres" value={stats.total} />
          <StatCard label="Lus" value={stats.read} />
          <StatCard label="En cours" value={stats.reading} />
          <StatCard label="À lire" value={stats.toRead} />
          <StatCard label="Séries" value={stats.series} />
          <StatCard label="Tomes" value={stats.tomes} />
          <StatCard
            label="Note moyenne"
            value={
              stats.averageRating > 0
                ? `${stats.averageRating.toFixed(1)}/5`
                : "—"
            }
          />
          <StatCard label="Abandonnés" value={stats.abandoned} />
        </section>

        {/* RECHERCHE UTILISATEURS */}
        <section className="mt-6 rounded-[20px] border border-[#31095A]/10 bg-white p-5 shadow-[0_4px_20px_rgba(49,9,90,0.05)]">
          <h2 className="text-xl font-black">
            Trouver des lecteurs
          </h2>

          <p className="mt-1 text-sm text-[#31095A]/60">
            Recherche un utilisateur par pseudo.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={searchUsername}
              onChange={(event) => {
                setSearchUsername(event.target.value);

                if (event.target.value.trim().length < 2) {
                  setSearchResults([]);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchUsers();
                }
              }}
              placeholder="Ex. MR"
              className="flex-1 rounded-xl border border-[#31095A]/15 bg-[#FFF9F2] px-4 py-3 outline-none focus:border-[#31095A]"
            />

            <button
              onClick={handleSearchUsers}
              disabled={searching}
              className="rounded-xl bg-[#31095A] px-6 py-3 font-bold text-[#31095A] disabled:opacity-50"
            >
              {searching ? "Recherche..." : "Rechercher"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-5 space-y-3">
              {searchResults.map((result) => {
                const relationshipStatus = getRelationshipStatus(
                  result.id
                );

                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#31095A]/10 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f837e2] font-black text-[#31095A]">
                        {result.avatar_url ? (
                          <img
                            src={result.avatar_url}
                            alt={result.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          result.username
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div>
                        <p className="font-bold">
                          {result.username}
                        </p>
                      </div>
                    </div>

                    {relationshipStatus === "ACCEPTED" ? (
                      <span className="rounded-xl bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                        Ami
                      </span>
                    ) : relationshipStatus === "PENDING" ? (
                      <span className="rounded-xl bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700">
                        Demande en attente
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          sendFriendRequest(result.id)
                        }
                        disabled={sendingRequest === result.id}
                        className="rounded-xl bg-[#31095A] px-4 py-2 text-sm font-bold text-[#31095A] disabled:opacity-50"
                      >
                        {sendingRequest === result.id
                          ? "Envoi..."
                          : "Ajouter"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {searchUsername.trim().length >= 2 &&
            !searching &&
            searchResults.length === 0 && (
              <p className="mt-5 text-sm text-[#31095A]/60">
                Aucun utilisateur trouvé.
              </p>
            )}
        </section>

        {/* DEMANDES REÇUES */}
        <section className="mt-6 rounded-[20px] border border-[#31095A]/10 bg-white p-5 shadow-[0_4px_20px_rgba(49,9,90,0.05)]">
          <h2 className="text-xl font-black">
            Demandes d'ami
          </h2>

          {loadingFriendships ? (
            <p className="mt-4 text-sm text-[#31095A]/60">
              Chargement...
            </p>
          ) : receivedRequests.length === 0 ? (
            <p className="mt-4 text-sm text-[#31095A]/60">
              Aucune demande en attente.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {receivedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#31095A]/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f837e2] font-black text-[#31095A]">
                      {request.profile?.avatar_url ? (
                        <img
                          src={request.profile.avatar_url}
                          alt={request.profile.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        request.profile?.username
                          ?.charAt(0)
                          .toUpperCase() ?? "?"
                      )}
                    </div>

                    <div>
                      <p className="font-bold">
                        {request.profile?.username ??
                          "Utilisateur"}
                      </p>

                      <p className="text-sm text-[#31095A]/60">
                        souhaite vous ajouter
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleFriendRequest(
                          request.id,
                          "ACCEPTED"
                        )
                      }
                      disabled={processingRequest === request.id}
                      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-[#31095A] disabled:opacity-50"
                    >
                      Accepter
                    </button>

                    <button
                      onClick={() =>
                        handleFriendRequest(
                          request.id,
                          "DECLINED"
                        )
                      }
                      disabled={processingRequest === request.id}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AMIS */}
        <section className="mt-6 rounded-[20px] border border-[#31095A]/10 bg-white p-5 shadow-[0_4px_20px_rgba(49,9,90,0.05)]">
          <h2 className="text-xl font-black">
            Mes amis
          </h2>

          {acceptedFriends.length === 0 ? (
            <p className="mt-4 text-sm text-[#31095A]/60">
              Tu n'as pas encore d'ami sur Biblidex.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {acceptedFriends.map((friendship) => (
                <div
                  key={friendship.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#31095A]/10 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f837e2] font-black text-[#31095A]">
                    {friendship.profile?.avatar_url ? (
                      <img
                        src={friendship.profile.avatar_url}
                        alt={friendship.profile.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      friendship.profile?.username
                        ?.charAt(0)
                        .toUpperCase() ?? "?"
                    )}
                  </div>

                  <div>
                    <p className="font-bold">
                      {friendship.profile?.username ??
                        "Utilisateur"}
                    </p>

                    <p className="text-sm text-green-600">
                      Ami
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DEMANDES ENVOYÉES */}
        {sentRequests.length > 0 && (
          <section className="mt-6 rounded-[20px] border border-[#31095A]/10 bg-white p-5 shadow-[0_4px_20px_rgba(49,9,90,0.05)]">
            <h2 className="text-xl font-black">
              Demandes envoyées
            </h2>

            <div className="mt-4 space-y-3">
              {sentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#31095A]/10 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f837e2] font-black text-[#31095A]">
                    {request.profile?.avatar_url ? (
                      <img
                        src={request.profile.avatar_url}
                        alt={request.profile.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      request.profile?.username
                        ?.charAt(0)
                        .toUpperCase() ?? "?"
                    )}
                  </div>

                  <div>
                    <p className="font-bold">
                      {request.profile?.username ??
                        "Utilisateur"}
                    </p>

                    <p className="text-sm text-yellow-600">
                      Demande en attente
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[20px] border border-[#31095A]/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#31095A]/60">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#31095A]">
        {value}
      </p>
    </div>
  );
}