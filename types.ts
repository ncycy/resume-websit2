export interface BaseItem {
  id: string;
}

export interface NewsItem extends BaseItem {
  date: string;
  content: string;
}

export interface Publication extends BaseItem {
  title: string;
  authors: string;
  venue: string;
  year: string;
  link?: string;
  tag?: string; // e.g., 'SSCI', 'SCI', 'CSSCI'
  type?: 'journal' | 'conference' | 'book';
}

export interface Project extends BaseItem {
  title: string;
  description: string;
  role: string;
  duration?: string;
  funding?: string;
  amount?: string;
}

export interface Education extends BaseItem {
  school: string;
  degree: string;
  year: string;
  major?: string;
}

export interface Experience extends BaseItem {
  organization: string;
  role: string;
  year: string;
  description?: string;
}

export interface Honor extends BaseItem {
  title: string;
  year: string;
  level?: string; // e.g. National, Provincial
  description?: string;
  type?: 'honor' | 'award';
}

export interface ServiceItem extends BaseItem {
  role: string;
}

export interface TeachingItem extends BaseItem {
  content: string;
}

export interface GalleryItem extends BaseItem {
  url: string;
  caption: string;
}

export interface OtherItem extends BaseItem {
  title: string;
  content: string;
}

export interface ProfileData {
  name: string;
  title: string;
  affiliation: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  researchInterests: string;
  bio: string;
  avatarUrl: string;
  qrCodeUrl: string;
  bannerUrl: string;
  admissionsText: string;
  education: Education[];
  experience: Experience[];
  honors: Honor[];
  services: ServiceItem[];
  teaching: TeachingItem[];
  news: NewsItem[]; 
  publications: Publication[];
  projects: Project[];
  gallery: GalleryItem[];
  others: OtherItem[];
}