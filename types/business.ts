export type BusinessSettings = {
  id: string;
  business_name: string;
  business_description: string;
  website_url: string | null;
  contact_email: string | null;
  phone: string | null;
  business_hours: string | null;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  starting_price: string | null;
  active: boolean;
  created_at: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  created_at: string;
};

export type BusinessKnowledge = {
  settings: BusinessSettings | null;
  services: Service[];
  faqs: Faq[];
};

export type AiKnowledge = {
  settings: Pick<BusinessSettings, "business_name" | "business_description" | "website_url" | "contact_email" | "phone" | "business_hours"> | null;
  services: Pick<Service, "name" | "description" | "starting_price">[];
  faqs: Pick<Faq, "question" | "answer">[];
};
