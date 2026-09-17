export const meetingStatuses = ["requested", "confirmed", "cancelled"] as const;

export type MeetingStatus = (typeof meetingStatuses)[number];

export type MeetingRow = {
  id: string;
  lead_id: string | null;
  name: string;
  email: string;
  service: string | null;
  meeting_date: string;
  meeting_time: string;
  timezone: string | null;
  status: MeetingStatus;
  public_token: string | null;
  booking_reference: string | null;
  created_at: string;
};

export type MeetingInsert = Omit<MeetingRow, "id" | "created_at" | "status" | "public_token" | "booking_reference"> & { status?: MeetingStatus; public_token?: string | null; booking_reference?: string | null };

export type MeetingMetrics = {
  total: number;
  requested: number;
  confirmed: number;
  cancelled: number;
};
