export type DerivedMembershipStatus = 'active' | 'expiring' | 'expired' | 'frozen';

export type MemberRecordStatus = 'active' | 'archived';
export type Gender = 'Male' | 'Female' | 'Other';

export type PlanStatus = 'active' | 'archived';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
export type PaymentType = 'New Membership' | 'Renewal' | 'Other';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

export type ExpenseCategory =
  | 'Rent'
  | 'Utilities'
  | 'Salaries'
  | 'Maintenance'
  | 'Supplies'
  | 'Marketing'
  | 'Other';

export type AttendanceStatus = 'present' | 'absent';

export type EnquiryStatus = 'New' | 'Contacted' | 'Interested' | 'Converted' | 'Lost' | 'Archived';
export type EnquirySource = 'Walk-in' | 'Instagram' | 'Google' | 'Referral' | 'WhatsApp' | 'Website';

export type StaffRole = 'Trainer' | 'Receptionist' | 'Manager' | 'Other';
export type StaffStatus = 'Active' | 'Inactive' | 'Archived';

export type NotificationType =
  | 'expired'
  | 'expiring'
  | 'payment'
  | 'birthday'
  | 'renewal'
  | 'system'
  | 'announcement';

export type ActivityType =
  | 'member_joined'
  | 'payment_received'
  | 'membership_renewed'
  | 'membership_frozen'
  | 'membership_resumed'
  | 'expense_logged'
  | 'profile_updated'
  | 'attendance_marked'
  | 'enquiry_added'
  | 'plan_created'
  | 'wish_sent'
  | 'notice_sent';

export interface UserProfile {
  id: string;
  gym_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export interface GymProfile {
  id: string;
  name: string;
  logo_url?: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  instagram: string;
  opening_hours: string;
  created_at: string;
}

export interface NotificationPreferences {
  expiry_reminder: boolean;
  payment_reminder: boolean;
  birthday_reminder: boolean;
  renewal_reminder: boolean;
}

export interface Member {
  id: string;
  gym_id: string;
  member_code: string;
  name: string;
  avatar_url?: string;
  phone: string;
  email?: string;
  date_of_birth?: string; // YYYY-MM-DD
  gender?: Gender;
  address?: string;
  emergency_contact?: string;
  joining_date: string; // YYYY-MM-DD
  status: MemberRecordStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  gym_id: string;
  member_id: string;
  plan_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status: 'active' | 'expiring' | 'expired' | 'renewed' | 'frozen';
  amount: number;
  created_at: string;
}

export interface MembershipFreeze {
  id: string;
  gym_id: string;
  member_id: string;
  membership_id: string;
  start_date: string; // YYYY-MM-DD
  planned_end_date: string; // YYYY-MM-DD
  resumed_at?: string; // YYYY-MM-DD
  days_frozen: number;
  reason: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  membership_id?: string;
  transaction_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  status: PaymentStatus;
  payment_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Expense {
  id: string;
  gym_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: PaymentMethod;
  expense_date: string; // YYYY-MM-DD
  vendor_name?: string;
  notes?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  gym_id: string;
  member_id: string;
  attendance_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  check_in_time?: string; // HH:mm
  created_at: string;
}

export interface Enquiry {
  id: string;
  gym_id: string;
  name: string;
  phone: string;
  email?: string;
  interested_plan: string;
  source: EnquirySource;
  status: EnquiryStatus;
  follow_up_date?: string; // YYYY-MM-DD
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BirthdayMessage {
  id: string;
  gym_id: string;
  member_id: string;
  message: string;
  sent_at: string;
  created_at: string;
}

export interface FestivalMessage {
  id: string;
  gym_id: string;
  festival: string;
  message_template: string;
  audience: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  gym_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  gym_id: string;
  type: ActivityType;
  description: string;
  related_member_id?: string;
  created_at: string;
}

export interface StaffMember {
  id: string;
  gym_id: string;
  name: string;
  avatar_url?: string;
  phone: string;
  email?: string;
  role: StaffRole;
  joining_date: string;
  status: StaffStatus;
  created_at: string;
}

export interface EnrichedMember extends Member {
  currentMembership?: Membership;
  currentPlan?: MembershipPlan;
  activeFreeze?: MembershipFreeze;
  derivedStatus: DerivedMembershipStatus;
  daysRemaining: number;
  expiryDate?: string;
  paymentStatus: 'Paid' | 'Due';
  pendingAmount: number;
  totalPaid: number;
  attendanceCount: number;
}

export interface GymStoreState {
  profile: UserProfile;
  gym: GymProfile;
  notificationPrefs: NotificationPreferences;
  plans: MembershipPlan[];
  members: Member[];
  memberships: Membership[];
  freezes: MembershipFreeze[];
  payments: Payment[];
  expenses: Expense[];
  attendance: AttendanceRecord[];
  enquiries: Enquiry[];
  birthdayMessages: BirthdayMessage[];
  festivalMessages: FestivalMessage[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
  staff: StaffMember[];
}
