import {
  ActivityItem,
  AttendanceRecord,
  Enquiry,
  Expense,
  GymProfile,
  GymStoreState,
  Member,
  Membership,
  MembershipFreeze,
  MembershipPlan,
  NotificationItem,
  Payment,
  PaymentMethod,
  StaffMember,
  UserProfile,
} from '../types';
import { addDaysISO, getTodayISO, toISODate } from '../utils/formatters';

export const DEFAULT_GYM_ID = 'gym-fitflow-001';
export const OWNER_AVATAR_PATH = '/src/assets/images/owner_rahul_avatar_1795493325525.jpg';

const INDIAN_MEMBERS: Array<{ name: string; gender: 'Male' | 'Female'; area: string }> = [
  { name: 'Amit Sharma', gender: 'Male', area: 'Indiranagar, Bengaluru' },
  { name: 'Priya Patel', gender: 'Female', area: 'Koramangala, Bengaluru' },
  { name: 'Rahul Kumar', gender: 'Male', area: 'HSR Layout, Bengaluru' },
  { name: 'Mohit Verma', gender: 'Male', area: 'Jayanagar, Bengaluru' },
  { name: 'Neha Kulkarni', gender: 'Female', area: 'Sadashivanagar, Bengaluru' },
  { name: 'Rohan Deshmukh', gender: 'Male', area: 'Whitefield, Bengaluru' },
  { name: 'Ananya Iyer', gender: 'Female', area: 'Malleshwaram, Bengaluru' },
  { name: 'Vikramaditya Singh', gender: 'Male', area: 'Banjara Hills, Hyderabad' },
  { name: 'Sneha Gupta', gender: 'Female', area: 'Sector 18, Gurugram' },
  { name: 'Arjun Nair', gender: 'Male', area: 'Domlur, Bengaluru' },
  { name: 'Pooja Reddy', gender: 'Female', area: 'Jubilee Hills, Hyderabad' },
  { name: 'Kabir Malhotra', gender: 'Male', area: 'Bandra West, Mumbai' },
  { name: 'Siddharth Joshi', gender: 'Male', area: 'Kothrud, Pune' },
  { name: 'Kavita Rao', gender: 'Female', area: 'JP Nagar, Bengaluru' },
  { name: 'Aditya Chatterjee', gender: 'Male', area: 'Salt Lake, Kolkata' },
  { name: 'Meera Krishnan', gender: 'Female', area: 'Adyar, Chennai' },
  { name: 'Karan Bedi', gender: 'Male', area: 'Vasant Vihar, New Delhi' },
  { name: 'Divya Menon', gender: 'Female', area: 'Panampilly Nagar, Kochi' },
  { name: 'Pranav Agarwal', gender: 'Male', area: 'Civil Lines, Jaipur' },
  { name: 'Riya Sengupta', gender: 'Female', area: 'Ballygunge, Kolkata' },
  { name: 'Harshvardhan Tiwari', gender: 'Male', area: 'Gomti Nagar, Lucknow' },
  { name: 'Tanvi Kapoor', gender: 'Female', area: 'Powai, Mumbai' },
  { name: 'Nikhil Bansal', gender: 'Male', area: 'DLF Phase 4, Gurugram' },
  { name: 'Shruti Hegde', gender: 'Female', area: 'Basavanagudi, Bengaluru' },
  { name: 'Varun Khanna', gender: 'Male', area: 'Punjabi Bagh, New Delhi' },
  { name: 'Ishita Bose', gender: 'Female', area: 'Park Street, Kolkata' },
  { name: 'Manish Pandey', gender: 'Male', area: 'Aliganj, Lucknow' },
  { name: 'Swati Deshpande', gender: 'Female', area: 'Shivaji Nagar, Pune' },
  { name: 'Gaurav Mehta', gender: 'Male', area: 'Navrangpura, Ahmedabad' },
  { name: 'Aarti Chawla', gender: 'Female', area: 'Model Town, Ludhiana' },
  { name: 'Deepak Choudhary', gender: 'Male', area: 'Vaishali Nagar, Jaipur' },
  { name: 'Nandini Subramanian', gender: 'Female', area: 'T. Nagar, Chennai' },
  { name: 'Rajeshwari Shetty', gender: 'Female', area: 'Mangalore Central' },
  { name: 'Yashwant Gowda', gender: 'Male', area: 'Rajajinagar, Bengaluru' },
  { name: 'Sonal Jain', gender: 'Female', area: 'Vijay Nagar, Indore' },
  { name: 'Abhishek Mishra', gender: 'Male', area: 'Kankarbagh, Patna' },
  { name: 'Kriti Saxena', gender: 'Female', area: 'Sector 62, Noida' },
  { name: 'Tushar Gokhale', gender: 'Male', area: 'Dadar West, Mumbai' },
  { name: 'Pallavi Mahajan', gender: 'Female', area: 'Aundh, Pune' },
  { name: 'Saurabh Rathore', gender: 'Male', area: 'Malviya Nagar, Jaipur' },
  { name: 'Bhavna Trivedi', gender: 'Female', area: 'Satellite, Ahmedabad' },
  { name: 'Rishabh Bhatia', gender: 'Male', area: 'Rajouri Garden, New Delhi' },
  { name: 'Simran Kaur', gender: 'Female', area: 'Sector 17, Chandigarh' },
  { name: 'Vivek Tripathi', gender: 'Male', area: 'Sigra, Varanasi' },
  { name: 'Aditi Joshi', gender: 'Female', area: 'Viman Nagar, Pune' },
  { name: 'Kunal Oberoi', gender: 'Male', area: 'Juhu, Mumbai' },
  { name: 'Preeti Sood', gender: 'Female', area: 'Panchkula, Chandigarh' },
  { name: 'Devansh Kulkarni', gender: 'Male', area: 'Baner, Pune' },
  { name: 'Nisha Agarwal', gender: 'Female', area: 'C-Scheme, Jaipur' },
  { name: 'Sandeep Yadav', gender: 'Male', area: 'Sushant Lok, Gurugram' },
  { name: 'Charu Bhardwaj', gender: 'Female', area: 'Greater Kailash, New Delhi' },
  { name: 'Pratik Shah', gender: 'Male', area: 'Bodakdev, Ahmedabad' },
  { name: 'Monika Rawat', gender: 'Female', area: 'Rajpur Road, Dehradun' },
  { name: 'Aakash Srivastava', gender: 'Male', area: 'Hazratganj, Lucknow' },
  { name: 'Zoya Khan', gender: 'Female', area: 'Andheri West, Mumbai' },
  { name: 'Tarun Pillai', gender: 'Male', area: 'Edappally, Kochi' },
];

export function createSeedData(): GymStoreState {
  const todayISO = getTodayISO();
  const todayDate = new Date();
  const nowISO = todayDate.toISOString();

  const profile: UserProfile = {
    id: 'user-owner-rahul',
    gym_id: DEFAULT_GYM_ID,
    name: 'Rahul Verma',
    email: 'rahul@fitflowgym.in',
    avatar_url: OWNER_AVATAR_PATH,
    role: 'Owner & Head Coach',
    created_at: addDaysISO(todayISO, -365) + 'T08:00:00Z',
  };

  const gym: GymProfile = {
    id: DEFAULT_GYM_ID,
    name: 'FitFlow Studio',
    phone: '+91 98450 11223',
    email: 'hello@fitflowgym.in',
    address: '100 Feet Road, Indiranagar, Bengaluru 560038',
    website: 'https://fitflowgym.in',
    instagram: '@fitflow.indiranagar',
    opening_hours: '5:30 AM – 10:30 PM',
    created_at: addDaysISO(todayISO, -365) + 'T08:00:00Z',
  };

  const plans: MembershipPlan[] = [
    {
      id: 'plan-monthly',
      gym_id: DEFAULT_GYM_ID,
      name: 'Monthly',
      price: 1500,
      duration_days: 30,
      description: 'Full gym floor & cardio zone access for 30 days.',
      status: 'active',
      created_at: addDaysISO(todayISO, -300) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-quarterly',
      gym_id: DEFAULT_GYM_ID,
      name: 'Quarterly',
      price: 4000,
      duration_days: 90,
      description: '90-day strength & conditioning access with initial body assessment.',
      status: 'active',
      created_at: addDaysISO(todayISO, -300) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-half-yearly',
      gym_id: DEFAULT_GYM_ID,
      name: 'Half-Yearly',
      price: 7000,
      duration_days: 180,
      description: '6 months unlimited gym access, group classes & locker facility.',
      status: 'active',
      created_at: addDaysISO(todayISO, -300) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-yearly',
      gym_id: DEFAULT_GYM_ID,
      name: 'Yearly',
      price: 12000,
      duration_days: 365,
      description: 'Best value 12-month membership including monthly InBody scans.',
      status: 'active',
      created_at: addDaysISO(todayISO, -300) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-premium',
      gym_id: DEFAULT_GYM_ID,
      name: 'Premium',
      price: 8500,
      duration_days: 90,
      description: 'Quarterly membership + 12 guided coaching sessions & nutrition check-in.',
      status: 'active',
      created_at: addDaysISO(todayISO, -240) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-morning',
      gym_id: DEFAULT_GYM_ID,
      name: 'Morning Express',
      price: 1200,
      duration_days: 30,
      description: 'Off-peak access from 5:30 AM to 11:00 AM daily.',
      status: 'active',
      created_at: addDaysISO(todayISO, -200) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-student',
      gym_id: DEFAULT_GYM_ID,
      name: 'Student Quarterly',
      price: 3200,
      duration_days: 90,
      description: 'Discounted 3-month plan for college students with valid ID.',
      status: 'active',
      created_at: addDaysISO(todayISO, -180) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-couple',
      gym_id: DEFAULT_GYM_ID,
      name: 'Couple Annual',
      price: 21000,
      duration_days: 365,
      description: 'Full-year dual access for partners training together.',
      status: 'active',
      created_at: addDaysISO(todayISO, -150) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'plan-pt-pack',
      gym_id: DEFAULT_GYM_ID,
      name: 'Personal Training',
      price: 6000,
      duration_days: 30,
      description: 'Dedicated 1-on-1 personal coach for 16 sessions over 30 days.',
      status: 'active',
      created_at: addDaysISO(todayISO, -120) + 'T09:00:00Z',
      updated_at: nowISO,
    },
  ];

  const members: Member[] = [];
  const memberships: Membership[] = [];
  const payments: Payment[] = [];
  const methods: PaymentMethod[] = ['UPI', 'Card', 'Cash', 'Bank Transfer'];

  // Create 56 realistic members with controlled expiry distribution, birthdays, and payment history
  INDIAN_MEMBERS.forEach((info, idx) => {
    const num = idx + 1;
    const memberId = `mem-${String(num).padStart(3, '0')}`;
    const memberCode = `FF-${1000 + num}`;
    const phoneDigits = String(9810000000 + idx * 137291 + 43210).slice(0, 10);
    const phone = `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`;
    const slug = info.name.toLowerCase().replace(/[^a-z]+/g, '.');
    const email = `${slug}@gmail.com`;

    // Birthdays:
    // idx 0, 6, 19 -> TODAY! (3 birthdays today)
    // idx 2, 9, 14, 25 -> within next 7 days
    // idx 3, 11, 22, 31, 40 -> later this month
    const birthYear = 1988 + (idx % 16);
    let dobDate: Date;
    if (idx === 0 || idx === 6 || idx === 19) {
      dobDate = new Date(birthYear, todayDate.getMonth(), todayDate.getDate());
    } else if (idx === 2 || idx === 9 || idx === 14 || idx === 25) {
      const offset = (idx % 6) + 1;
      dobDate = new Date(birthYear, todayDate.getMonth(), todayDate.getDate() + offset);
    } else if (idx === 3 || idx === 11 || idx === 22 || idx === 31 || idx === 40) {
      const day = Math.min(28, ((todayDate.getDate() + 10 + idx) % 27) + 1);
      dobDate = new Date(birthYear, todayDate.getMonth(), day);
    } else {
      const month = (idx * 3) % 12;
      const day = ((idx * 7) % 27) + 1;
      dobDate = new Date(birthYear, month, day);
    }
    const dob = toISODate(dobDate);

    // Joining dates: first 15 joined this month (within last 24 days), rest spread across past 11 months
    const joiningOffsetDays =
      idx < 14
        ? -(idx % 22)
        : -(26 + ((idx * 17) % 310));
    const joiningDate = addDaysISO(todayISO, joiningOffsetDays);

    // Plan selection
    const planPool = [
      plans[4], // Premium
      plans[1], // Quarterly
      plans[0], // Monthly
      plans[3], // Yearly
      plans[2], // Half-Yearly
      plans[5], // Morning Express
      plans[6], // Student Quarterly
      plans[8], // Personal Training
    ];
    const plan = planPool[idx % planPool.length];

    // Expiry distribution:
    // idx 3, 10, 18, 27, 36, 44 -> Expired (-2 to -24 days ago) -> 6 expired
    // idx 2, 7, 13, 21, 29, 34, 41, 48 -> Expiring within 7 days (+0 to +7 days) -> 8 expiring soon
    // idx 5, 12, 16, 24, 32, 39 -> Expiring in 8 to 28 days -> 6 more renewals this month
    // remaining 36 -> Active (+32 to +280 days)
    let endDate: string;
    if ([3, 10, 18, 27, 36, 44].includes(idx)) {
      endDate = addDaysISO(todayISO, -(2 + (idx % 18)));
    } else if ([2, 7, 13, 21, 29, 34, 41, 48].includes(idx)) {
      endDate = addDaysISO(todayISO, (idx % 7) + 1);
    } else if ([5, 12, 16, 24, 32, 39].includes(idx)) {
      endDate = addDaysISO(todayISO, 9 + (idx % 19));
    } else {
      endDate = addDaysISO(todayISO, 32 + ((idx * 13) % 240));
    }

    const startDate = addDaysISO(endDate, -plan.duration_days);

    members.push({
      id: memberId,
      gym_id: DEFAULT_GYM_ID,
      member_code: memberCode,
      name: info.name,
      phone,
      email,
      date_of_birth: dob,
      gender: info.gender,
      address: info.area,
      emergency_contact: `+91 98${String(20000000 + idx * 7123).slice(0, 8)}`,
      joining_date: joiningDate,
      status: 'active',
      notes: idx % 4 === 0 ? 'Prefers morning strength training slot.' : undefined,
      created_at: joiningDate + 'T07:30:00Z',
      updated_at: nowISO,
    });

    const membershipId = `mship-curr-${num}`;
    const rawDiff = Math.round((new Date(endDate).getTime() - new Date(todayISO).getTime()) / 86400000);
    memberships.push({
      id: membershipId,
      gym_id: DEFAULT_GYM_ID,
      member_id: memberId,
      plan_id: plan.id,
      start_date: startDate,
      end_date: endDate,
      status: rawDiff < 0 ? 'expired' : rawDiff <= 7 ? 'expiring' : 'active',
      amount: plan.price,
      created_at: startDate + 'T09:00:00Z',
    });

    // Historical prior membership for ~38 members so renewal history & revenue over 12 months are rich
    if (idx % 3 !== 0) {
      const prevPlan = plans[(idx + 1) % 4];
      const prevEnd = addDaysISO(startDate, -1);
      const prevStart = addDaysISO(prevEnd, -prevPlan.duration_days);
      const prevMshipId = `mship-prev-${num}`;
      memberships.push({
        id: prevMshipId,
        gym_id: DEFAULT_GYM_ID,
        member_id: memberId,
        plan_id: prevPlan.id,
        start_date: prevStart,
        end_date: prevEnd,
        status: 'renewed',
        amount: prevPlan.price,
        created_at: prevStart + 'T09:00:00Z',
      });

      const prevPayDate = prevStart > addDaysISO(todayISO, -350) ? prevStart : addDaysISO(todayISO, -((idx * 11) % 300));
      payments.push({
        id: `pay-prev-${num}`,
        gym_id: DEFAULT_GYM_ID,
        member_id: memberId,
        membership_id: prevMshipId,
        transaction_id: `TXN-${2026000 + num * 3}`,
        amount: prevPlan.price,
        payment_method: methods[(idx + 1) % methods.length],
        payment_type: 'New Membership',
        status: 'Paid',
        payment_date: prevPayDate,
        created_at: prevPayDate + 'T10:15:00Z',
      });
    }

    // Current payment record
    // Make 4 specific payments Pending totaling ₹12,500! (e.g. ₹4,000 + ₹4,000 + ₹3,000/1500... let's match exact amounts)
    const pendingIndices = [4, 15, 28, 43];
    const isPending = pendingIndices.includes(idx);
    const pendingAmounts: Record<number, number> = {
      4: 4000,
      15: 4000,
      28: 3000,
      43: 1500,
    };

    // Spread current payment dates nicely across last 45 days so This Month & 7D/30D look lively
    let currentPayDate: string;
    if (idx < 3) {
      currentPayDate = todayISO; // Today's revenue
    } else if (idx < 10) {
      currentPayDate = addDaysISO(todayISO, -(idx - 2)); // Within last 7 days
    } else if (idx < 28) {
      currentPayDate = addDaysISO(todayISO, -((idx % 22) + 1)); // This month
    } else {
      // Place 18 of the remaining payments in last month (30..52 days ago) and rest across prior months
      currentPayDate =
        idx < 46
          ? addDaysISO(todayISO, -(28 + (idx - 28)))
          : addDaysISO(todayISO, -(55 + ((idx * 11) % 240)));
    }

    payments.push({
      id: `pay-curr-${num}`,
      gym_id: DEFAULT_GYM_ID,
      member_id: memberId,
      membership_id: membershipId,
      transaction_id: `TXN-${2026500 + num * 5}`,
      amount: isPending ? pendingAmounts[idx] : plan.price,
      payment_method: methods[idx % methods.length],
      payment_type: idx % 3 === 0 ? 'New Membership' : 'Renewal',
      status: isPending ? 'Pending' : idx === 47 ? 'Failed' : 'Paid',
      payment_date: currentPayDate,
      created_at: currentPayDate + 'T11:30:00Z',
    });
  });

  // Add realistic monthly renewal & PT payments across the past 12 months
  for (let mOffset = 1; mOffset <= 11; mOffset++) {
    const baseMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - mOffset, 15);
    const baseCount = mOffset === 1 ? 8 : 5;
    for (let k = 0; k < baseCount; k++) {
      const memIdx = (mOffset * 7 + k * 3) % members.length;
      const member = members[memIdx];
      const dt = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), Math.min(26, 3 + k * 3));
      const payDate = toISODate(dt);
      const amt = mOffset === 1 ? [8500, 7000, 12000, 6000, 4000, 7000, 8500, 4000][k % 8] : [4000, 7000, 8500, 12000, 6000][k % 5];
      payments.push({
        id: `pay-hist-${mOffset}-${k}`,
        gym_id: DEFAULT_GYM_ID,
        member_id: member.id,
        transaction_id: `TXN-${2025800 + mOffset * 20 + k}`,
        amount: amt,
        payment_method: methods[(mOffset + k) % methods.length],
        payment_type: k % 3 === 0 ? 'Other' : 'Renewal',
        status: mOffset === 3 && k === 2 ? 'Refunded' : 'Paid',
        payment_date: payDate,
        created_at: payDate + 'T16:40:00Z',
      });
    }
  }

  // Attendance records across today + past 6 days
  const attendance: AttendanceRecord[] = [];
  const checkInSlots = ['06:05', '06:30', '07:15', '08:00', '09:10', '17:30', '18:15', '19:05', '19:45', '20:20'];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dateStr = addDaysISO(todayISO, -dayOffset);
    // ~28-36 check-ins per day across the 56 members
    members.forEach((m, idx) => {
      if ((idx + dayOffset * 3) % 5 !== 0) {
        const isPresent = (idx + dayOffset) % 7 !== 0;
        attendance.push({
          id: `att-${dateStr}-${m.id}`,
          gym_id: DEFAULT_GYM_ID,
          member_id: m.id,
          attendance_date: dateStr,
          status: isPresent ? 'present' : 'absent',
          check_in_time: isPresent ? checkInSlots[(idx + dayOffset) % checkInSlots.length] : undefined,
          created_at: dateStr + 'T07:00:00Z',
        });
      }
    });
  }

  // Enquiries (12 realistic Indian leads)
  const enquiries: Enquiry[] = [
    {
      id: 'enq-001',
      gym_id: DEFAULT_GYM_ID,
      name: 'Raghavendra Nair',
      phone: '+91 98801 44512',
      email: 'raghav.nair@gmail.com',
      interested_plan: 'Quarterly',
      source: 'Walk-in',
      status: 'New',
      follow_up_date: todayISO,
      notes: 'Visited morning session, wants strength + mobility assessment.',
      created_at: addDaysISO(todayISO, -1) + 'T10:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-002',
      gym_id: DEFAULT_GYM_ID,
      name: 'Ishani Sen',
      phone: '+91 99002 77811',
      email: 'ishani.sen@outlook.com',
      interested_plan: 'Premium',
      source: 'Instagram',
      status: 'Interested',
      follow_up_date: todayISO,
      notes: 'Asked about evening female coach availability.',
      created_at: addDaysISO(todayISO, -2) + 'T14:20:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-003',
      gym_id: DEFAULT_GYM_ID,
      name: 'Samarth Bhosale',
      phone: '+91 97650 33190',
      interested_plan: 'Yearly',
      source: 'Referral',
      status: 'Contacted',
      follow_up_date: addDaysISO(todayISO, 1),
      notes: 'Referred by Amit Sharma (FF-1001). Wants weekend trial.',
      created_at: addDaysISO(todayISO, -3) + 'T11:15:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-004',
      gym_id: DEFAULT_GYM_ID,
      name: 'Tanya Chhabra',
      phone: '+91 98112 66402',
      interested_plan: 'Half-Yearly',
      source: 'Google',
      status: 'New',
      follow_up_date: todayISO,
      notes: 'Called via Google listing; comparing quarterly vs half-yearly.',
      created_at: todayISO + 'T08:30:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-005',
      gym_id: DEFAULT_GYM_ID,
      name: 'Devika Menon',
      phone: '+91 98451 22980',
      interested_plan: 'Morning Express',
      source: 'Walk-in',
      status: 'Converted',
      follow_up_date: addDaysISO(todayISO, -4),
      notes: 'Joined Morning Express plan.',
      created_at: addDaysISO(todayISO, -6) + 'T09:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-006',
      gym_id: DEFAULT_GYM_ID,
      name: 'Harishankar Menon',
      phone: '+91 99450 88123',
      interested_plan: 'Personal Training',
      source: 'WhatsApp',
      status: 'Interested',
      follow_up_date: addDaysISO(todayISO, 2),
      notes: 'Looking for post-injury knee rehab & strength plan.',
      created_at: addDaysISO(todayISO, -4) + 'T17:45:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-007',
      gym_id: DEFAULT_GYM_ID,
      name: 'Payal Khandelwal',
      phone: '+91 98290 51092',
      interested_plan: 'Monthly',
      source: 'Instagram',
      status: 'Contacted',
      follow_up_date: addDaysISO(todayISO, 3),
      notes: 'Sent fee structure on WhatsApp.',
      created_at: addDaysISO(todayISO, -5) + 'T13:10:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-008',
      gym_id: DEFAULT_GYM_ID,
      name: 'Nitin Gadkari',
      phone: '+91 97400 19482',
      interested_plan: 'Couple Annual',
      source: 'Referral',
      status: 'Converted',
      follow_up_date: addDaysISO(todayISO, -8),
      notes: 'Converted with spouse.',
      created_at: addDaysISO(todayISO, -10) + 'T16:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-009',
      gym_id: DEFAULT_GYM_ID,
      name: 'Lakshmi Narayanan',
      phone: '+91 98401 73910',
      interested_plan: 'Quarterly',
      source: 'Google',
      status: 'Lost',
      follow_up_date: addDaysISO(todayISO, -7),
      notes: 'Relocated to another neighbourhood.',
      created_at: addDaysISO(todayISO, -14) + 'T11:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-010',
      gym_id: DEFAULT_GYM_ID,
      name: 'Shubham Raj',
      phone: '+91 91234 89012',
      interested_plan: 'Student Quarterly',
      source: 'Walk-in',
      status: 'New',
      follow_up_date: addDaysISO(todayISO, 1),
      notes: 'College student near Indiranagar Metro.',
      created_at: todayISO + 'T11:20:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-011',
      gym_id: DEFAULT_GYM_ID,
      name: 'Ankita Deshpande',
      phone: '+91 98220 44190',
      interested_plan: 'Quarterly',
      source: 'Website',
      status: 'Converted',
      follow_up_date: addDaysISO(todayISO, -3),
      notes: 'Signed up after trial.',
      created_at: addDaysISO(todayISO, -5) + 'T15:00:00Z',
      updated_at: nowISO,
    },
    {
      id: 'enq-012',
      gym_id: DEFAULT_GYM_ID,
      name: 'Rohan Saluja',
      phone: '+91 98180 55412',
      interested_plan: 'Yearly',
      source: 'Instagram',
      status: 'Interested',
      follow_up_date: addDaysISO(todayISO, 2),
      notes: 'Tour scheduled for tomorrow at 6 PM.',
      created_at: addDaysISO(todayISO, -2) + 'T18:30:00Z',
      updated_at: nowISO,
    },
  ];

  // Staff (6 team members)
  const staff: StaffMember[] = [
    {
      id: 'stf-001',
      gym_id: DEFAULT_GYM_ID,
      name: 'Vikram Rathore',
      phone: '+91 98451 10021',
      email: 'vikram@fitflowgym.in',
      role: 'Manager',
      joining_date: addDaysISO(todayISO, -320),
      status: 'Active',
      created_at: addDaysISO(todayISO, -320) + 'T09:00:00Z',
    },
    {
      id: 'stf-002',
      gym_id: DEFAULT_GYM_ID,
      name: 'Coach Rhea Kapoor',
      phone: '+91 98451 10022',
      email: 'rhea@fitflowgym.in',
      role: 'Trainer',
      joining_date: addDaysISO(todayISO, -240),
      status: 'Active',
      created_at: addDaysISO(todayISO, -240) + 'T09:00:00Z',
    },
    {
      id: 'stf-003',
      gym_id: DEFAULT_GYM_ID,
      name: 'Coach Karthik Shetty',
      phone: '+91 98451 10023',
      email: 'karthik@fitflowgym.in',
      role: 'Trainer',
      joining_date: addDaysISO(todayISO, -190),
      status: 'Active',
      created_at: addDaysISO(todayISO, -190) + 'T09:00:00Z',
    },
    {
      id: 'stf-004',
      gym_id: DEFAULT_GYM_ID,
      name: 'Sanjana Nair',
      phone: '+91 98451 10024',
      email: 'sanjana@fitflowgym.in',
      role: 'Receptionist',
      joining_date: addDaysISO(todayISO, -150),
      status: 'Active',
      created_at: addDaysISO(todayISO, -150) + 'T09:00:00Z',
    },
    {
      id: 'stf-005',
      gym_id: DEFAULT_GYM_ID,
      name: 'Coach Imran Qureshi',
      phone: '+91 98451 10025',
      email: 'imran@fitflowgym.in',
      role: 'Trainer',
      joining_date: addDaysISO(todayISO, -95),
      status: 'Active',
      created_at: addDaysISO(todayISO, -95) + 'T09:00:00Z',
    },
    {
      id: 'stf-006',
      gym_id: DEFAULT_GYM_ID,
      name: 'Mahesh Gowda',
      phone: '+91 98451 10026',
      email: 'mahesh@fitflowgym.in',
      role: 'Other',
      joining_date: addDaysISO(todayISO, -280),
      status: 'Active',
      created_at: addDaysISO(todayISO, -280) + 'T09:00:00Z',
    },
  ];

  // Initial notifications
  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      gym_id: DEFAULT_GYM_ID,
      type: 'expired',
      title: 'Expired memberships need follow-up',
      message: '6 memberships have expired and are awaiting renewal outreach.',
      link: '/members?filter=expired',
      is_read: false,
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-2',
      gym_id: DEFAULT_GYM_ID,
      type: 'expiring',
      title: 'Memberships expiring within 7 days',
      message: '8 members have plans expiring in the next 7 days.',
      link: '/members?filter=expiring',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-3',
      gym_id: DEFAULT_GYM_ID,
      type: 'payment',
      title: 'Pending payments recorded',
      message: '4 payments totaling ₹12,500 are still pending collection.',
      link: '/payments?status=Pending',
      is_read: false,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-4',
      gym_id: DEFAULT_GYM_ID,
      type: 'birthday',
      title: 'Birthdays today',
      message: '3 gym members celebrate their birthday today. Send wishes!',
      link: '/communication/birthdays',
      is_read: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-5',
      gym_id: DEFAULT_GYM_ID,
      type: 'renewal',
      title: 'Renewals due this month',
      message: '14 renewals are scheduled over the next 30 days.',
      link: '/renewals',
      is_read: true,
      created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Recent activities
  const activities: ActivityItem[] = [
    {
      id: 'act-1',
      gym_id: DEFAULT_GYM_ID,
      type: 'member_joined',
      description: 'Amit Sharma joined on Premium plan',
      related_member_id: 'mem-001',
      created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-2',
      gym_id: DEFAULT_GYM_ID,
      type: 'payment_received',
      description: '₹4,000 UPI payment received from Rahul Kumar',
      related_member_id: 'mem-003',
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-3',
      gym_id: DEFAULT_GYM_ID,
      type: 'membership_renewed',
      description: 'Priya Patel renewed Quarterly membership',
      related_member_id: 'mem-002',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-4',
      gym_id: DEFAULT_GYM_ID,
      type: 'profile_updated',
      description: 'Neha Kulkarni updated emergency contact',
      related_member_id: 'mem-005',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-5',
      gym_id: DEFAULT_GYM_ID,
      type: 'attendance_marked',
      description: 'Morning batch check-ins recorded for 38 members',
      created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-6',
      gym_id: DEFAULT_GYM_ID,
      type: 'enquiry_added',
      description: 'New walk-in enquiry logged for Raghavendra Nair',
      created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Seed 12 months of realistic Indian gym operating expenses
  const expenses: Expense[] = [];
  for (let mOffset = 0; mOffset < 12; mOffset++) {
    const baseMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - mOffset, 1);
    const yr = baseMonth.getFullYear();
    const mo = baseMonth.getMonth();
    const safeDay = (day: number) => {
      const dt = new Date(yr, mo, Math.min(day, mOffset === 0 ? Math.max(1, todayDate.getDate()) : 28));
      return toISODate(dt);
    };

    const rentDate = safeDay(5);
    expenses.push({
      id: `exp-rent-${mOffset}`,
      gym_id: DEFAULT_GYM_ID,
      title: 'Studio Facility Rent',
      category: 'Rent',
      amount: 42000,
      payment_method: 'Bank Transfer',
      expense_date: rentDate,
      vendor_name: 'HSR Commercial Properties',
      notes: 'Monthly lease for main training floor & locker area',
      created_at: `${rentDate}T10:00:00Z`,
    });

    const salaryDate = safeDay(7);
    expenses.push({
      id: `exp-sal-${mOffset}`,
      gym_id: DEFAULT_GYM_ID,
      title: 'Trainer & Front-Desk Payroll',
      category: 'Salaries',
      amount: mOffset < 3 ? 38000 : 35000,
      payment_method: 'Bank Transfer',
      expense_date: salaryDate,
      vendor_name: 'FitFlow Staff Payroll',
      notes: '3 coaches + receptionist + housekeeping',
      created_at: `${salaryDate}T11:30:00Z`,
    });

    const utilDate = safeDay(11);
    expenses.push({
      id: `exp-util-${mOffset}`,
      gym_id: DEFAULT_GYM_ID,
      title: 'BESCOM Electricity & AC Bill',
      category: 'Utilities',
      amount: 9800 + ((mOffset * 750) % 3400),
      payment_method: 'UPI',
      expense_date: utilDate,
      vendor_name: 'BESCOM Power',
      created_at: `${utilDate}T14:15:00Z`,
    });

    if (mOffset % 2 === 0) {
      const maintDate = safeDay(16);
      expenses.push({
        id: `exp-maint-${mOffset}`,
        gym_id: DEFAULT_GYM_ID,
        title: mOffset === 0 ? 'Treadmill Belt & Cable Servicing' : 'Strength Rack & AC Preventive Service',
        category: 'Maintenance',
        amount: mOffset === 0 ? 4800 : 3600 + ((mOffset * 400) % 2400),
        payment_method: 'UPI',
        expense_date: maintDate,
        vendor_name: 'ProFit Equipment Care',
        created_at: `${maintDate}T16:00:00Z`,
      });
    }

    const supDate = safeDay(14);
    expenses.push({
      id: `exp-sup-${mOffset}`,
      gym_id: DEFAULT_GYM_ID,
      title: 'Sanitizers, Towels & Disinfectants',
      category: 'Supplies',
      amount: 2600 + ((mOffset * 350) % 1400),
      payment_method: mOffset % 2 === 0 ? 'Cash' : 'UPI',
      expense_date: supDate,
      vendor_name: 'Metro Hygiene Mart',
      created_at: `${supDate}T12:20:00Z`,
    });

    if (mOffset % 3 === 0) {
      const mktDate = safeDay(9);
      expenses.push({
        id: `exp-mkt-${mOffset}`,
        gym_id: DEFAULT_GYM_ID,
        title: 'Instagram Local Lead Ads',
        category: 'Marketing',
        amount: 3500,
        payment_method: 'Card',
        expense_date: mktDate,
        vendor_name: 'Meta Ads India',
        created_at: `${mktDate}T15:00:00Z`,
      });
    }
  }

  // Seed realistic membership freeze records (2 active pauses + 1 completed)
  const freezes: MembershipFreeze[] = [
    {
      id: 'frz-001',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'mem-009',
      membership_id: 'mship-curr-9',
      start_date: addDaysISO(todayISO, -4),
      planned_end_date: addDaysISO(todayISO, 10),
      days_frozen: 14,
      reason: 'Out of Station — Work Travel',
      status: 'active',
      created_at: addDaysISO(todayISO, -4) + 'T09:15:00Z',
    },
    {
      id: 'frz-002',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'mem-015',
      membership_id: 'mship-curr-15',
      start_date: addDaysISO(todayISO, -2),
      planned_end_date: addDaysISO(todayISO, 19),
      days_frozen: 21,
      reason: 'Medical / Shoulder Recovery',
      status: 'active',
      created_at: addDaysISO(todayISO, -2) + 'T11:40:00Z',
    },
    {
      id: 'frz-003',
      gym_id: DEFAULT_GYM_ID,
      member_id: 'mem-002',
      membership_id: 'mship-curr-2',
      start_date: addDaysISO(todayISO, -28),
      planned_end_date: addDaysISO(todayISO, -18),
      resumed_at: addDaysISO(todayISO, -18),
      days_frozen: 10,
      reason: 'Family Wedding Travel',
      status: 'completed',
      created_at: addDaysISO(todayISO, -28) + 'T10:00:00Z',
    },
  ];

  // Mark frozen memberships cleanly
  const activeFreezeMembershipIds = new Set(freezes.filter((f) => f.status === 'active').map((f) => f.membership_id));
  memberships.forEach((ms) => {
    if (activeFreezeMembershipIds.has(ms.id)) {
      ms.status = 'frozen';
    }
  });

  return {
    profile,
    gym,
    notificationPrefs: {
      expiry_reminder: true,
      payment_reminder: true,
      birthday_reminder: true,
      renewal_reminder: true,
    },
    plans,
    members,
    memberships,
    freezes,
    payments,
    expenses,
    attendance,
    enquiries,
    birthdayMessages: [],
    festivalMessages: [],
    notifications,
    activities,
    staff,
  };
}
