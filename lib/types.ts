export type Profile = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string;
  title: string;
  location: string;
  bio: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
  twitter: string;
  avatar_url: string | null;
  skills: string[];
  education: Array<{ degree: string; institution: string; year: string }>;
  experience: Array<{
    position: string;
    company: string;
    duration: string;
    description: string;
  }>;
};
