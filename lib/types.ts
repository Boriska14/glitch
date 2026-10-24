export type Section = { page?: number; label?: string; title: string; desc?: string };
export type Playlist = { title: string; url: string; note?: string };
export type Moodboard = { title: string; url: string; note?: string };

/** hidden = visible seulement dans l'admin · draft = teaser « Bientôt » · published = en ligne */
export type Status = "hidden" | "draft" | "published";

export type Volume = {
  slug: string;
  number: number;
  title: string;
  status: Status;
  releaseDate?: string;
  hooks: string[];
  handwritten?: string;
  editorial?: string;
  cover?: string;
  pdf?: string;
  sections: Section[];
  playlists: Playlist[];
  moodboards: Moodboard[];
};

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  author: string;
  substackUrl: string;
  spotifyProfileUrl: string;
  pinterestProfileUrl: string;
  instagramUrl?: string;
  /** Pseudo Substack pour importer les Notes (déduit de l'adresse si vide). */
  substackHandle?: string;
  /** « Sujet du volume » affiché au-dessus du formulaire de correspondance. */
  letterTopic?: string;
};

export type Post = {
  slug: string;
  title: string;
  link: string;
  date: string;
  excerpt: string;
  html: string;
  image?: string;
};

export type Note = { id: string; text: string; date: string; url?: string; source: "substack" | "manual" };

export type MessageKind = "letter" | "comment";
export type MessageStatus = "pending" | "approved" | "rejected";
export type Message = {
  id: string;
  kind: MessageKind;
  target?: { type: "volume" | "post"; slug: string };
  name: string;
  subject?: string;
  body: string;
  /** Privé : jamais affiché publiquement. */
  email?: string;
  status: MessageStatus;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
};
export type PublicMessage = Omit<Message, "email" | "status">;
export type Settings = Partial<SiteConfig>;
